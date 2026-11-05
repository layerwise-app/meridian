import { useEffect, useState } from 'react';
import { renderInline } from './Markdown';

type Item = { id: string; text: string };

/** Tracks which section is being read: the last heading above a line near the top. */
function useActiveSection(items: Item[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (items.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.28;
      let current: string | null = null;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= line) current = item.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items]);
  return active;
}

/** The sticky contents rail beside a post on wide screens. */
export function ContentsRail({ items }: { items: Item[] }) {
  const active = useActiveSection(items);
  if (items.length === 0) return null;
  return (
    <nav aria-label='Contents' className='sticky top-[calc(var(--header-h)+2rem)]'>
      <p className='label text-ink-soft'>Contents</p>
      <ol className='mt-3 border-l border-rule'>
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? 'location' : undefined}
                className='-ml-px block border-l-2 border-transparent py-1.5 pl-3.5 text-[0.9rem] leading-snug text-ink-soft transition-colors hover:text-ink aria-[current=location]:border-accent aria-[current=location]:text-ink'
              >
                {renderInline(item.text)}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** A collapsed contents list above the post on narrower screens. */
export function ContentsInline({ items }: { items: Item[] }) {
  if (items.length === 0) return null;
  return (
    <details className='group border-y border-rule'>
      <summary className='flex min-h-12 cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden'>
        <span className='label text-ink-soft'>Contents · {items.length} sections</span>
        <span aria-hidden='true' className='mono text-sm text-ink-soft transition-transform group-open:rotate-45'>
          +
        </span>
      </summary>
      <nav aria-label='Contents'>
        <ol className='pb-3'>
          {items.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className='flex min-h-11 items-baseline gap-3 py-1 text-[1rem]'
              >
                <span className='mono w-5 shrink-0 text-[0.75rem] text-accent'>{i + 1}</span>
                <span className='link'>{renderInline(item.text)}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
