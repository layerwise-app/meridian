import { useEffect, useRef, useState } from 'react';
import type { Evaluation, ModelColumn } from '~/content/model-card';
import { clsx } from 'clsx';

type SortKey = 'name' | ModelColumn['key'];
type Sort = { key: SortKey; dir: 'asc' | 'desc' } | null;

/**
 * The evaluation table: real HTML, sortable by any column, with an inline bar
 * per score that draws once when the table first scrolls into view, and a
 * footnote for every benchmark.
 */
export function EvalTable({
  evaluations,
  columns,
  caption,
  idPrefix
}: {
  evaluations: Evaluation[];
  columns: ModelColumn[];
  caption: string;
  /** Keeps footnote anchors unique when the table appears twice on a site. */
  idPrefix: string;
}) {
  const [sort, setSort] = useState<Sort>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [bars, setBars] = useState<'static' | 'pending' | 'drawing'>('static');

  // Draw the bars once: hold them at zero until the table is in view.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return; // already visible: leave drawn
    setBars('pending');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Two frames, so the zero state is painted before the transition starts.
          requestAnimationFrame(() => requestAnimationFrame(() => setBars('drawing')));
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const order = evaluations.map((e, i) => ({ e, n: i + 1 }));
  const rows = sort
    ? [...order].sort((a, b) => {
        if (sort.key === 'name') {
          const cmp = a.e.name.localeCompare(b.e.name);
          return sort.dir === 'asc' ? cmp : -cmp;
        }
        const va = a.e.scores[sort.key];
        const vb = b.e.scores[sort.key];
        // Missing scores always sink to the bottom.
        if (va === null && vb === null) return 0;
        if (va === null) return 1;
        if (vb === null) return -1;
        return sort.dir === 'asc' ? va - vb : vb - va;
      })
    : order;

  const toggle = (key: SortKey) => {
    setSort((current) => {
      const firstDir = key === 'name' ? 'asc' : 'desc';
      if (!current || current.key !== key) return { key, dir: firstDir };
      if (current.dir === firstDir) return { key, dir: firstDir === 'asc' ? 'desc' : 'asc' };
      return null; // third press returns to the authored order
    });
  };

  const ariaSort = (key: SortKey) =>
    sort?.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';

  const best = (row: Evaluation) =>
    Math.max(...columns.map((c) => row.scores[c.key] ?? -1));

  return (
    <div>
      <div ref={wrapRef} data-bars={bars === 'static' ? undefined : bars} className='overflow-x-auto'>
        <table className='data-table'>
          <caption className='label mb-3 text-left text-ink-soft caption-top'>
            {caption}
          </caption>
          <colgroup>
            <col className='w-[27%] md:w-[30%]' />
            {columns.map((c) => (
              <col key={c.key} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope='col' aria-sort={ariaSort('name')}>
                <SortButton active={sort?.key === 'name'} dir={sort?.dir} onClick={() => toggle('name')}>
                  Benchmark
                </SortButton>
              </th>
              {columns.map((c) => (
                <th key={c.key} scope='col' aria-sort={ariaSort(c.key)} className={clsx(c.ours && 'text-accent')}>
                  <SortButton active={sort?.key === c.key} dir={sort?.dir} onClick={() => toggle(c.key)}>
                    {c.label}
                  </SortButton>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ e, n }, rowIndex) => {
              const top = best(e);
              return (
                <tr key={e.id}>
                  <th scope='row' className='text-[0.98rem] md:text-[1.05rem]'>
                    <span className='leading-snug'>{e.name}</span>
                    <a
                      href={`#${idPrefix}-fn-${e.id}`}
                      id={`${idPrefix}-fnref-${e.id}`}
                      className='sn-ref ml-0.5'
                      aria-label={`Footnote ${n}: about ${e.name}`}
                    >
                      {n}
                    </a>
                    <span className='mono mt-0.5 block text-[0.7rem] font-normal text-ink-soft'>
                      {e.metric}
                    </span>
                  </th>
                  {columns.map((c) => {
                    const v = e.scores[c.key];
                    return (
                      <td
                        key={c.key}
                        className={clsx('mono text-[0.85rem] md:text-[0.95rem]', c.ours && 'is-ours')}
                      >
                        {v === null ? (
                          <span className='text-ink-soft'>
                            <span aria-hidden='true'>—</span>
                            <span className='visually-hidden'>Not evaluated</span>
                          </span>
                        ) : (
                          <>
                            <span className={clsx(v === top && 'font-medium', c.ours ? 'text-accent' : v === top ? 'text-ink' : 'text-ink-soft')}>
                              {v.toFixed(1)}
                            </span>
                            <span className='bar-track' aria-hidden='true'>
                              <span
                                className='bar-fill'
                                style={{ '--v': v / 100, '--i': rowIndex } as React.CSSProperties}
                              />
                            </span>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ol className='mt-6 grid gap-x-10 gap-y-3 text-[0.88rem] leading-relaxed text-ink-soft md:grid-cols-2' aria-label='Benchmark notes'>
        {evaluations.map((e, i) => (
          <li key={e.id} id={`${idPrefix}-fn-${e.id}`} className='grid scroll-mt-28 grid-cols-[1.5rem_minmax(0,1fr)] target:bg-accent-wash'>
            <span className='sn-num'>{i + 1}</span>
            <span>
              <span className='text-ink'>{e.name}.</span> {e.measures}{' '}
              <span className='text-ink'>Known weaknesses:</span> {e.weaknesses}{' '}
              <a href={`#${idPrefix}-fnref-${e.id}`} className='mono text-accent' aria-label={`Back to ${e.name} in the table`}>
                ↩
              </a>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SortButton({
  active,
  dir,
  onClick,
  children
}: {
  active: boolean;
  dir?: 'asc' | 'desc';
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='-mx-1 inline-flex min-h-11 flex-wrap items-end gap-x-1 px-1 pb-0.5 text-left uppercase hover:text-ink'
    >
      <span>{children}</span>
      <span aria-hidden='true' className={clsx('w-2.5 shrink-0', !active && 'opacity-35')}>
        {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}
