import type { ReactNode } from 'react';
import type { Sidenote } from '~/content/types';
import { Chart } from './Charts';
import { CitationRef } from './Citation';
import {
  citationKeys,
  FIRST_SIDENOTE,
  typeset,
  type ArticleIndex,
  type Block,
  type Numbered
} from './parse';

/**
 * Inline syntax, in priority order: bold, italic, code, sidenote marker,
 * citation, link.
 */
const INLINE =
  /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[\^([\w-]+)(!?)\]|\[@([^\]]+)\]|\[([^\]]+)\]\(([^)\s]+)\)/g;

type InlineContext = { index?: ArticleIndex };

/** Renders the inline subset (used for sidenote text and short copy too). */
export function renderInline(text: string, ctx: InlineContext = {}): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0;
    if (start > last) out.push(typeset(text.slice(last, start)));
    last = start + match[0].length;
    const k = key++;
    const [, bold, italic, code, note, first, cite, linkText, href] = match;
    if (bold) out.push(<strong key={k}>{renderInline(bold, ctx)}</strong>);
    else if (italic) out.push(<em key={k}>{renderInline(italic, ctx)}</em>);
    else if (code) out.push(<code key={k}>{code}</code>);
    else if (note) {
      out.push(<SidenoteMarker key={k} id={note} first={first === '!'} ctx={ctx} />);
    }
    else if (cite) {
      const items = citationKeys(cite)
        .map((citeKey) => ctx.index?.citations.get(citeKey))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      out.push(<CitationRef key={k} items={items} />);
    } else if (linkText && href) {
      const external = /^https?:\/\//.test(href);
      out.push(
        <a
          key={k}
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {renderInline(linkText, ctx)}
        </a>
      );
    }
  }
  if (last < text.length) out.push(typeset(text.slice(last)));
  return out;
}

function SidenoteMarker({
  id,
  first,
  ctx
}: {
  id: string;
  first: boolean;
  ctx: InlineContext;
}) {
  const note = ctx.index?.sidenotes.get(id);
  if (!note) return null;
  return (
    <>
      <a href={`#sn-${note.n}`} id={first ? `snref-${note.n}` : undefined} className='sn-ref'>
        <span className='visually-hidden'>Note </span>
        {note.n}
      </a>
      {first ? (
        <span className='sidenote' role='note'>
          <span className='sn-num'>{note.n}</span>
          {renderInline(note.text)}
        </span>
      ) : null}
    </>
  );
}

/** The same notes, as numbered footnotes after their paragraph on narrow screens. */
function InlineFootnotes({ notes }: { notes: Numbered<Sidenote>[] }) {
  if (notes.length === 0) return null;
  return (
    <ol className='sn-footnotes' aria-label='Notes'>
      {notes.map((note) => (
        <li key={note.id} id={`sn-${note.n}`}>
          <span className='sn-num'>{note.n}</span>
          <span>{renderInline(note.text)}</span>
        </li>
      ))}
    </ol>
  );
}

export function ArticleBody({ index }: { index: ArticleIndex }) {
  return (
    <>
      {index.blocks.map((block, i) => (
        <BlockView key={i} block={block} index={index} />
      ))}
    </>
  );
}

/** Sidenotes whose first reference is in this text, in order. */
function firstNotes(texts: string[], index: ArticleIndex) {
  const notes: Numbered<Sidenote>[] = [];
  for (const text of texts) {
    for (const match of text.matchAll(FIRST_SIDENOTE)) {
      const note = index.sidenotes.get(match[1]);
      if (note) notes.push(note);
    }
  }
  return notes;
}

function BlockView({ block, index }: { block: Block; index: ArticleIndex }) {
  const ctx: InlineContext = { index };
  switch (block.type) {
    case 'h2':
      return <h2 id={block.id}>{renderInline(block.text)}</h2>;
    case 'h3':
      return <h3 id={block.id}>{renderInline(block.text)}</h3>;
    case 'p':
      return (
        <>
          <p>{renderInline(block.text, ctx)}</p>
          <InlineFootnotes notes={firstNotes([block.text], index)} />
        </>
      );
    case 'quote':
      return (
        <>
          <blockquote>
            <p>{renderInline(block.text, ctx)}</p>
          </blockquote>
          <InlineFootnotes notes={firstNotes([block.text], index)} />
        </>
      );
    case 'ul':
    case 'ol': {
      const items = block.items.map((item, i) => (
        <li key={i}>{renderInline(item, ctx)}</li>
      ));
      const List = block.type;
      return (
        <>
          <List>{items}</List>
          <InlineFootnotes notes={firstNotes(block.items, index)} />
        </>
      );
    }
    case 'figure': {
      const entry = index.figures.get(block.id);
      if (!entry) return null;
      return (
        <figure className='figure figure-wide' id={`figure-${entry.n}`}>
          <Chart spec={entry.spec} />
          <figcaption>
            <span className='fig-label'>Figure {entry.n}</span>
            {renderInline(entry.spec.caption)}
          </figcaption>
        </figure>
      );
    }
  }
}

export function References({ index }: { index: ArticleIndex }) {
  const items = [...index.citations.values()];
  if (items.length === 0) return null;
  return (
    <section aria-labelledby='references' className='mt-16 border-t border-ink pt-6'>
      <h2 id='references' className='label text-ink-soft'>
        References
      </h2>
      <ol className='mt-4 space-y-3 pl-0 text-[0.95rem] leading-relaxed'>
        {items.map((cite) => (
          <li
            key={cite.key}
            id={`ref-${cite.key}`}
            className='grid scroll-mt-24 grid-cols-[2.25rem_minmax(0,1fr)] target:bg-accent-wash'
          >
            <span className='sn-num'>[{cite.n}]</span>
            <span>
              {cite.authors} ({cite.year}). <em>{cite.title}</em>.{' '}
              <span className='text-ink-soft'>{cite.venue}.</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

