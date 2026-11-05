#!/usr/bin/env node
/**
 * pnpm share-images
 *
 * Renders, for every page and every research post:
 *   - public/figures/<seed>-<width>.webp: a still of the page's contour field,
 *     shown under the canvas until it starts (and without JavaScript);
 *   - public/og/<key>.png: a 1200×630 share image in the site's style.
 * Then writes src/content/generated/figures.json and share.json.
 *
 * Unchanged images are skipped (pass --force to redo them all). Run it after
 * adding a post or changing a title, seed, colour, or font. Needs Node 24+ (it imports the TypeScript
 * content files directly).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => join(root, 'src', p);
const load = async (p) => import(pathToFileURL(src(p)).href);

const { createField, traceContours, FIELD_STROKES } = await load('lib/field.ts');
const { siteConfig } = await load('site.config.ts');
const { home } = await load('content/home.ts');
const { modelCard } = await load('content/model-card.ts');
const { careers } = await load('content/careers.ts');
const { researchIndex, privacyPage, termsPage } = await load('content/pages.ts');
const { figureAspects } = await load('content/figures.ts');

const posts = [];
for (const file of readdirSync(src('content/research')).filter((f) => f.endsWith('.ts')).sort()) {
  posts.push((await load(`content/research/${file}`)).default);
}
posts.sort((a, b) => b.date.localeCompare(a.date));

const fontFile = (name) => {
  const buffer = readFileSync(join(root, 'scripts/fonts', name));
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
};
const serif = fontFile('newsreader-latin-400-normal.woff');
const serifItalic = fontFile('newsreader-latin-400-italic.woff');
const mono = fontFile('ibm-plex-mono-latin-400-normal.woff');

const { colors } = siteConfig;
const fingerprint = createHash('sha256')
  .update(readFileSync(src('lib/field.ts')))
  .update(readFileSync(fileURLToPath(import.meta.url)))
  .update(JSON.stringify(colors))
  .digest('hex')
  .slice(0, 12);

// ---------------------------------------------------------------------------
// Drawing helpers

function fieldPaths(seed, width, height, strokeScale) {
  const field = createField(seed);
  const contours = traceContours(field, { width, height, cell: Math.max(3, width / 170), t: 0 });
  const d = (arr) => {
    let out = '';
    for (let i = 0; i < arr.length; i += 4) {
      out += `M${arr[i].toFixed(1)} ${arr[i + 1].toFixed(1)}L${arr[i + 2].toFixed(1)} ${arr[i + 3].toFixed(1)}`;
    }
    return out;
  };
  const layer = (arr, style, color) =>
    arr.length
      ? `<path d="${d(arr)}" fill="none" stroke="${color}" stroke-opacity="${style.alpha}" stroke-width="${(style.width * strokeScale).toFixed(2)}" stroke-linecap="round"/>`
      : '';
  return (
    layer(contours.lines, FIELD_STROKES.lines, colors.ink) +
    layer(contours.index, FIELD_STROKES.index, colors.ink) +
    layer(contours.accent, FIELD_STROKES.accent, colors.accent)
  );
}

/** Text as an SVG path, with optional letter spacing (in em). */
function textPath(font, text, x, y, size, { spacing = 0, fill = colors.ink } = {}) {
  let cursor = x;
  let d = '';
  const glyphs = font.stringToGlyphs(text);
  glyphs.forEach((glyph, i) => {
    d += glyph.getPath(cursor, y, size).toPathData(2);
    const next = glyphs[i + 1];
    const kern = next ? font.getKerningValue(glyph, next) : 0;
    cursor += ((glyph.advanceWidth + kern) / font.unitsPerEm) * size + spacing * size;
  });
  return { svg: `<path d="${d}" fill="${fill}"/>`, width: cursor - x };
}

const measure = (font, text, size, spacing = 0) =>
  (font.getAdvanceWidth(text, size) || 0) + spacing * size * text.length;

function wrapText(font, text, size, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(font, next, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function fitTitle(text, maxWidth, maxLines) {
  for (let size = 66; size >= 38; size -= 2) {
    const lines = wrapText(serif, text, size, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  const size = 38;
  const lines = wrapText(serif, text, size, maxWidth).slice(0, maxLines);
  lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\W*\w+$/, '')}…`;
  return { size, lines };
}

const truncate = (font, text, size, maxWidth, spacing = 0) => {
  if (measure(font, text, size, spacing) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && measure(font, `${cut}…`, size, spacing) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
};

const logoMark = (x, y, size) => {
  const s = size / 64;
  return `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="32" cy="32" r="25" fill="none" stroke="${colors.ink}" stroke-width="5.5"/><path d="M32 7 C49 16 49 48 32 57" fill="none" stroke="${colors.accent}" stroke-width="5.5" stroke-linecap="round"/></g>`;
};

function shareSvg({ seed, kicker, title, subtitle, meta }) {
  const W = 1200;
  const H = 630;
  const panelX = 680;
  const left = 64;
  const textWidth = panelX - left - 56;
  const parts = [];
  parts.push(`<rect width="${W}" height="${H}" fill="${colors.paper}"/>`);
  parts.push(`<svg x="${panelX}" y="0" width="${W - panelX}" height="${H}" viewBox="0 0 ${W - panelX} ${H}">${fieldPaths(seed, W - panelX, H, 1.6)}</svg>`);
  parts.push(`<line x1="${panelX}" y1="0" x2="${panelX}" y2="${H}" stroke="${colors.ink}" stroke-width="1.5"/>`);

  // Masthead
  parts.push(logoMark(left, 52, 40));
  parts.push(textPath(serif, siteConfig.company, left + 54, 84, 34).svg);

  // Kicker
  const kick = truncate(mono, kicker.toUpperCase(), 17, textWidth, 0.08);
  parts.push(textPath(mono, kick, left, 196, 17, { spacing: 0.08, fill: colors.accent }).svg);

  // Title
  const { size, lines } = fitTitle(title, textWidth, subtitle ? 3 : 4);
  const lineHeight = size * 1.08;
  let y = 196 + 30 + size * 0.86;
  for (const line of lines) {
    parts.push(textPath(serif, line, left - 2, y, size).svg);
    y += lineHeight;
  }
  if (subtitle) {
    const subLines = wrapText(serifItalic, subtitle, 26, textWidth).slice(0, 3);
    y += 4;
    for (const line of subLines) {
      parts.push(textPath(serifItalic, line, left, y, 26, { fill: colors.inkSoft }).svg);
      y += 34;
    }
  }

  // Footer rule and meta line
  parts.push(`<line x1="${left}" y1="${H - 92}" x2="${panelX - 56}" y2="${H - 92}" stroke="${colors.rule}" stroke-width="1.5"/>`);
  const metaText = truncate(mono, meta, 16, textWidth);
  parts.push(textPath(mono, metaText, left, H - 56, 16, { fill: colors.inkSoft }).svg);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;
}

function stillSvg(seed, width, height) {
  // Line widths assume the still is shown at about half its pixel width (2x screens).
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${colors.paper}"/>${fieldPaths(seed, width, height, 2)}</svg>`;
}

// ---------------------------------------------------------------------------
// What to render

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDate = (iso) => {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
};
const topicsLine = (() => {
  const topics = [...new Set(posts.map((p) => p.topic.toLowerCase()))];
  return topics.length > 1 ? `${topics.slice(0, -1).join(', ')}, and ${topics.at(-1)}` : topics[0];
})();

const shares = [
  {
    key: 'home',
    seed: home.statement.screen.kind === 'drawn' ? home.statement.screen.seed : 'home',
    kicker: home.statement.kicker,
    title: home.statement.headline,
    meta: `${modelCard.name} is available for research access`
  },
  {
    key: 'research',
    seed: 'research',
    kicker: researchIndex.kicker,
    title: researchIndex.title,
    subtitle: `${posts.length} papers and notes on ${topicsLine}.`,
    meta: siteConfig.locations.join(' · ')
  },
  {
    key: 'meridian-3',
    seed: 'meridian-3',
    kicker: modelCard.kicker,
    title: modelCard.title,
    subtitle: modelCard.standfirst.split('. ')[0] + '.',
    meta: modelCard.facts.slice(0, 3).map((f) => f.value.replace(/ \(.*\)$/, '')).join(' · ')
  },
  {
    key: 'careers',
    seed: 'careers',
    kicker: careers.kicker,
    title: careers.title,
    meta: `${careers.roles.length} open roles · ${siteConfig.locations.join(' & ')}`
  },
  {
    key: 'privacy',
    seed: 'privacy',
    kicker: privacyPage.kicker,
    title: privacyPage.title,
    subtitle: privacyPage.intro,
    meta: `Last updated ${formatDate(privacyPage.updated)}`
  },
  {
    key: 'terms',
    seed: 'terms',
    kicker: termsPage.kicker,
    title: termsPage.title,
    subtitle: termsPage.intro.split('. ')[0] + '.',
    meta: `Last updated ${formatDate(termsPage.updated)}`
  },
  ...posts.map((post) => ({
    key: `post-${post.slug}`,
    seed: post.screen?.kind === 'drawn' ? post.screen.seed : post.slug,
    kicker: `Research · ${post.topic}`,
    title: post.title,
    meta: `${formatDate(post.date)} · ${post.authors.join(', ')}`
  }))
];

const stills = [
  ...Object.entries(figureAspects)
    .filter(([seed]) => seed !== 'post')
    .map(([seed, aspect]) => ({ seed, aspect })),
  ...posts
    .filter((post) => !post.screen || post.screen.kind === 'drawn')
    .map((post) => ({ seed: post.screen?.seed ?? post.slug, aspect: figureAspects.post }))
];
const STILL_WIDTHS = [800, 1600];

// ---------------------------------------------------------------------------
// Render

const manifestPath = (name) => src(`content/generated/${name}.json`);
const readManifest = (name) =>
  existsSync(manifestPath(name)) ? JSON.parse(readFileSync(manifestPath(name), 'utf8')) : {};
const force = process.argv.includes('--force');
const previousShare = force ? {} : readManifest('share');
const previousFigures = force ? {} : readManifest('figures');

mkdirSync(join(root, 'public/og'), { recursive: true });
mkdirSync(join(root, 'public/figures'), { recursive: true });

let rendered = 0;
const shareManifest = {};
for (const item of shares) {
  const hash = createHash('sha256').update(fingerprint).update(JSON.stringify(item)).digest('hex').slice(0, 16);
  const file = `/og/${item.key}.png`;
  const out = join(root, 'public', file);
  if (previousShare[item.key]?.hash !== hash || !existsSync(out)) {
    await sharp(Buffer.from(shareSvg(item))).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
    rendered++;
  }
  shareManifest[item.key] = { src: file, alt: `${item.title} — ${siteConfig.company}`, hash };
}

const figureManifest = {};
for (const { seed, aspect } of stills) {
  const hash = createHash('sha256').update(fingerprint).update(`${seed}:${aspect}:q62`).digest('hex').slice(0, 16);
  const files = STILL_WIDTHS.map((w) => ({ w, h: Math.round(w / aspect), file: `/figures/${seed}-${w}.webp` }));
  const fresh = previousFigures[seed]?.hash === hash && files.every((f) => existsSync(join(root, 'public', f.file)));
  if (!fresh) {
    for (const f of files) {
      await sharp(Buffer.from(stillSvg(seed, f.w, f.h))).webp({ quality: 62, effort: 6 }).toFile(join(root, 'public', f.file));
      rendered++;
    }
  }
  figureManifest[seed] = {
    src: files[0].file,
    srcSet: files.map((f) => `${f.file} ${f.w}w`).join(', '),
    width: files[0].w,
    height: files[0].h,
    hash
  };
}

// Remove images left behind by deleted posts or pages; these two folders hold
// only what this script makes.
const keep = new Set([
  ...Object.values(shareManifest).map((entry) => entry.src),
  ...Object.keys(figureManifest).flatMap((seed) => STILL_WIDTHS.map((w) => `/figures/${seed}-${w}.webp`))
]);
let removed = 0;
for (const [dir, ext] of [['og', '.png'], ['figures', '.webp']]) {
  for (const name of readdirSync(join(root, 'public', dir))) {
    if (name.endsWith(ext) && !keep.has(`/${dir}/${name}`)) {
      rmSync(join(root, 'public', dir, name));
      removed++;
    }
  }
}

writeFileSync(manifestPath('share'), `${JSON.stringify(shareManifest, null, 2)}\n`);
writeFileSync(manifestPath('figures'), `${JSON.stringify(figureManifest, null, 2)}\n`);
console.log(
  `share-images: ${rendered} file(s) rendered, ${removed} stale removed, ${shares.length} share images, ${stills.length} stills.`
);
