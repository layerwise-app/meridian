import type { Citation, FigureSpec, Post, Sidenote } from '~/content/types';

/**
 * A deliberately small Markdown dialect for posts: headings, paragraphs,
 * quotes, lists, figure lines, and inline sidenote and citation markers.
 * Parsing happens here; `Markdown.tsx` turns the result into React.
 */

export type Block =
  | { type: 'h2' | 'h3'; text: string; id: string }
  | { type: 'p' | 'quote'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'figure'; id: string };

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[’'`*]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') });
    if (quote.length) blocks.push({ type: 'quote', text: quote.join(' ') });
    if (list) blocks.push(list);
    paragraph = [];
    quote = [];
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      const text = heading[2].trim();
      blocks.push({
        type: heading[1].length === 2 ? 'h2' : 'h3',
        text,
        id: slugify(text)
      });
      continue;
    }
    const figure = /^::figure\[([\w-]+)\]$/.exec(line);
    if (figure) {
      flush();
      blocks.push({ type: 'figure', id: figure[1] });
      continue;
    }
    if (line.startsWith('>')) {
      if (paragraph.length || list) flush();
      quote.push(line.replace(/^>\s?/, ''));
      continue;
    }
    const bullet = /^([-*]|\d+\.)\s+(.+)$/.exec(line);
    if (bullet) {
      const type = bullet[1].endsWith('.') ? 'ol' : 'ul';
      if (paragraph.length || quote.length || (list && list.type !== type)) flush();
      list ??= { type, items: [] };
      list.items.push(bullet[2]);
      continue;
    }
    if (list && raw.startsWith('  ')) {
      // A wrapped list item.
      list.items[list.items.length - 1] += ` ${line}`;
      continue;
    }
    if (quote.length || list) flush();
    paragraph.push(line);
  }
  flush();
  return blocks;
}

export type Numbered<T> = T & { n: number };

/** Numbers for every sidenote, citation, and figure, in order of first use. */
export type ArticleIndex = {
  blocks: Block[];
  toc: { id: string; text: string }[];
  sidenotes: Map<string, Numbered<Sidenote>>;
  citations: Map<string, Numbered<Citation>>;
  figures: Map<string, Numbered<{ spec: FigureSpec }>>;
};

const SIDENOTE_REF = /\[\^([\w-]+)\]/g;
/** A sidenote's first reference, after `indexArticle` has marked it. */
export const FIRST_SIDENOTE = /\[\^([\w-]+)!\]/g;
const CITATION_REF = /\[@([^\]]+)\]/g;

export function citationKeys(inner: string) {
  return inner
    .split(';')
    .map((key) => key.trim().replace(/^@/, ''))
    .filter(Boolean);
}

export function indexArticle(post: Post): ArticleIndex {
  const blocks = parseBlocks(post.body ?? '');
  const notesById = new Map((post.sidenotes ?? []).map((note) => [note.id, note]));
  const citesByKey = new Map((post.citations ?? []).map((cite) => [cite.key, cite]));
  const figuresById = new Map((post.figures ?? []).map((spec) => [spec.id, spec]));

  const index: ArticleIndex = {
    blocks,
    toc: [],
    sidenotes: new Map(),
    citations: new Map(),
    figures: new Map()
  };

  // Marks each sidenote's first reference as `[^id!]`, so rendering knows
  // where its margin note goes without keeping state between blocks.
  const scan = (text: string) => {
    for (const match of text.matchAll(CITATION_REF)) {
      for (const key of citationKeys(match[1])) {
        const cite = citesByKey.get(key);
        if (cite && !index.citations.has(key)) {
          index.citations.set(key, { ...cite, n: index.citations.size + 1 });
        } else if (!cite && import.meta.env?.DEV) {
          console.warn(`[post ${post.slug}] Unknown citation [@${key}]`);
        }
      }
    }
    return text.replace(SIDENOTE_REF, (whole, id: string) => {
      const note = notesById.get(id);
      if (!note) {
        if (import.meta.env?.DEV) console.warn(`[post ${post.slug}] Unknown sidenote [^${id}]`);
        return '';
      }
      if (index.sidenotes.has(id)) return whole;
      index.sidenotes.set(id, { ...note, n: index.sidenotes.size + 1 });
      return `[^${id}!]`;
    });
  };

  for (const block of blocks) {
    if (block.type === 'h2') index.toc.push({ id: block.id, text: block.text });
    if (block.type === 'p' || block.type === 'quote') block.text = scan(block.text);
    if (block.type === 'ul' || block.type === 'ol') block.items = block.items.map(scan);
    if (block.type === 'figure') {
      const spec = figuresById.get(block.id);
      if (spec && !index.figures.has(block.id)) {
        index.figures.set(block.id, { spec, n: index.figures.size + 1 });
      }
    }
  }
  return index;
}

/** Straight quotes, dashes, and ellipses to their typeset forms. */
export function typeset(text: string) {
  return text
    .replace(/(^|[\s([{—–-])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s([{—–-])'/g, '$1‘')
    .replace(/'/g, '’')
    .replace(/\.\.\./g, '…')
    .replace(/ -- /g, ' – ');
}
