import { Popover } from 'radix-ui';
import type { Citation } from '~/content/types';
import type { Numbered } from './parse';

/** A bracketed citation number that opens the full reference in a popover. */
export function CitationRef({ items }: { items: Numbered<Citation>[] }) {
  if (items.length === 0) return null;
  const label = items.map((item) => item.n).join(', ');
  return (
    <Popover.Root>
      <Popover.Trigger
        className='cite'
        aria-label={`Reference ${label}: ${items.map((item) => item.title).join('; ')}`}
      >
        [{label}]
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className='cite-pop'
          side='top'
          align='center'
          sideOffset={6}
          collisionPadding={12}
        >
          <ol className='space-y-3'>
            {items.map((item) => (
              <li key={item.key} className='grid grid-cols-[1.75rem_minmax(0,1fr)]'>
                <span className='sn-num'>[{item.n}]</span>
                <span>
                  <CitationText citation={item} />{' '}
                  <a href={`#ref-${item.key}`} className='link mono text-[0.78rem] text-ink-soft'>
                    In references
                  </a>
                </span>
              </li>
            ))}
          </ol>
          <Popover.Arrow width={12} height={6} style={{ fill: 'var(--paper)' }} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function CitationText({ citation }: { citation: Citation }) {
  return (
    <>
      {citation.authors} ({citation.year}).{' '}
      {citation.url ? (
        <a href={citation.url} className='link italic'>
          {citation.title}
        </a>
      ) : (
        <em>{citation.title}</em>
      )}
      . <span className='text-ink-soft'>{citation.venue}.</span>
    </>
  );
}
