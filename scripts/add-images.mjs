#!/usr/bin/env node
/**
 * pnpm add-images <image or folder> [more…] [--name <name>]
 *
 * For each source image, writes WebP versions 800, 1600, and 2880 px wide to
 * public/images/<name>-<width>.webp (never enlarging), and records its
 * dimensions and a tiny blurred placeholder in src/content/images.json.
 * GIFs are copied untouched (public/images/<name>.gif). SVGs are rejected:
 * add vector art as a component instead.
 *
 * Then use it in a figure slot: { kind: 'image', image: '<name>', alt: '…' }.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/images');
const manifestPath = join(root, 'src/content/images.json');
const WIDTHS = [800, 1600, 2880];
const RASTER = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff', '.heic', '.heif']);

const args = process.argv.slice(2);
const nameIndex = args.indexOf('--name');
const customName = nameIndex >= 0 ? args[nameIndex + 1] : null;
const inputs = nameIndex >= 0 ? args.filter((_, i) => i !== nameIndex && i !== nameIndex + 1) : args;
if (nameIndex >= 0 && !customName) {
  console.error('--name needs a value, like --name lab-photo');
  process.exit(1);
}

if (inputs.length === 0) {
  console.error('Usage: pnpm add-images <image or folder> [more…] [--name <name>]');
  process.exit(1);
}

const files = inputs.flatMap((input) =>
  existsSync(input) && statSync(input).isDirectory()
    ? readdirSync(input).filter((f) => !f.startsWith('.')).map((f) => join(input, f))
    : [input]
);
if (customName && files.length > 1) {
  console.error('--name works with one image at a time.');
  process.exit(1);
}

const slug = (file) =>
  basename(file, extname(file))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'image';

const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
mkdirSync(outDir, { recursive: true });
let failed = 0;

async function placeholder(input) {
  const buffer = await sharp(input, { animated: false })
    .rotate()
    .resize(24, 24, { fit: 'inside' })
    .blur(1.2)
    .webp({ quality: 45 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

for (const file of files) {
  const ext = extname(file).toLowerCase();
  const name = customName ? slug(customName) : slug(file);
  if (!existsSync(file)) {
    console.error(`✕ ${file}: not found`);
    failed++;
    continue;
  }
  if (ext === '.svg') {
    console.error(`✕ ${file}: SVG is not accepted. Draw vector art as a React component instead.`);
    failed++;
    continue;
  }
  try {
    if (ext === '.gif') {
      const meta = await sharp(file).metadata();
      copyFileSync(file, join(outDir, `${name}.gif`));
      manifest[name] = {
        width: meta.width,
        height: meta.pageHeight ?? meta.height,
        widths: [],
        format: 'gif',
        placeholder: await placeholder(file)
      };
      console.log(`✓ ${name}: GIF copied unchanged (${meta.width}×${meta.pageHeight ?? meta.height})`);
      continue;
    }
    if (!RASTER.has(ext)) {
      console.error(`✕ ${file}: unsupported type ${ext || '(none)'}`);
      failed++;
      continue;
    }
    const meta = await sharp(file).rotate().metadata();
    // `rotate()` honours EXIF orientation, which can swap width and height.
    const turned = (meta.orientation ?? 1) >= 5;
    const width = turned ? meta.height : meta.width;
    const height = turned ? meta.width : meta.height;
    const widths = WIDTHS.filter((w) => w <= width);
    if (widths.length === 0) widths.push(width);
    for (const w of widths) {
      await sharp(file)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80, effort: 5 })
        .toFile(join(outDir, `${name}-${w}.webp`));
    }
    manifest[name] = { width, height, widths, format: 'webp', placeholder: await placeholder(file) };
    console.log(`✓ ${name}: ${widths.map((w) => `${w}w`).join(', ')} from ${width}×${height}`);
  } catch (error) {
    console.error(`✕ ${file}: ${error.message}`);
    failed++;
  }
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(manifestPath, `${JSON.stringify(sorted, null, 2)}\n`);
if (failed) process.exit(1);
