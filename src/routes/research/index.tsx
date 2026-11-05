import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScreenSlot } from '~/components/figure/ScreenSlot';
import { figureAspects } from '~/content/figures';
import { comingSoon, researchIndex } from '~/content/pages';
import type { PostSummary } from '~/content/posts';
import { TOPICS, type Topic } from '~/content/types';
import { listPosts } from '~/lib/posts.functions';
import { formatDate, shareImage } from '~/lib/share';
import { clsx } from 'clsx';
import { seo } from '~/utils/seo';

type ResearchSearch = { topic?: string; q?: string };

const topicSlug = (topic: Topic) => topic.toLowerCase();

/** `?topic=alignment,policy&q=honesty`, cleaned of anything unexpected. */
function validateSearch(search: Record<string, unknown>): ResearchSearch {
  const known = new Set(TOPICS.map(topicSlug));
  const topics =
    typeof search.topic === 'string'
      ? search.topic
          .toLowerCase()
          .split(',')
          .map((t) => t.trim())
          .filter((t) => known.has(t))
      : [];
  const q = typeof search.q === 'string' ? search.q.slice(0, 120) : '';
  return {
    ...(topics.length ? { topic: [...new Set(topics)].join(',') } : {}),
    ...(q.trim() ? { q } : {})
  };
}

export const Route = createFileRoute('/research/')({
  validateSearch,
  loader: () => listPosts(),
  head: () =>
    seo({
      title: researchIndex.seo.title,
      description: researchIndex.seo.description,
      path: '/research',
      ...shareImage('research')
    }),
  component: ResearchPage
});

function matches(post: PostSummary, words: string[]) {
  if (words.length === 0) return true;
  const haystack =
    `${post.title} ${post.authors.join(' ')} ${post.abstract} ${post.topic}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

function ResearchPage() {
  const posts = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => new Set(search.topic ? search.topic.split(',') : []),
    [search.topic]
  );
  // What is being typed, until it is written to the URL; otherwise the URL wins
  // (so back/forward and links with ?q= fill the box).
  const [draft, setDraft] = useState<string | null>(null);
  const query = draft ?? search.q ?? '';

  // Write the text filter to the URL shortly after typing stops.
  useEffect(() => {
    if (draft === null) return;
    const timer = setTimeout(() => {
      void navigate({
        search: (prev) => ({ ...prev, q: draft.trim() ? draft : undefined }),
        replace: true,
        resetScroll: false
      }).then(() => setDraft((current) => (current === draft ? null : current)));
    }, 220);
    return () => clearTimeout(timer);
  }, [draft, navigate]);
  const setQuery = (value: string) => setDraft(value);

  // "/" jumps to the search box, as in many reading tools.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const setTopics = (next: Set<string>) => {
    const ordered = TOPICS.map(topicSlug).filter((t) => next.has(t));
    void navigate({
      search: (prev) => ({ ...prev, topic: ordered.length ? ordered.join(',') : undefined }),
      replace: true,
      resetScroll: false
    });
  };
  const toggleTopic = (slug: string) => {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setTopics(next);
  };

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const visible = posts.filter(
    (post) =>
      (selected.size === 0 || selected.has(topicSlug(post.topic))) && matches(post, words)
  );
  const counts = new Map(
    TOPICS.map((topic) => [topic, posts.filter((p) => p.topic === topic).length])
  );
  const filtered = selected.size > 0 || words.length > 0;

  return (
    <div className='page pt-12 md:pt-20'>
      <header className='section-grid'>
        <p className='label pt-2 text-accent'>{researchIndex.kicker}</p>
        <div className='max-w-[46rem]'>
          <h1 className='text-[2.5rem] leading-[1.05] tracking-[-0.015em] md:text-[3.6rem]'>
            {researchIndex.title}
          </h1>
          <p className='mt-4 text-ink-soft'>{researchIndex.intro}</p>
        </div>
      </header>

      <figure className='mt-10 md:mt-14'>
        <ScreenSlot
          screen={researchIndex.screen}
          aspect={figureAspects.research}
          label={researchIndex.figureLabel}
          priority
          className='border-y border-ink'
        />
        <figcaption className='mt-2.5 text-[0.85rem] text-ink-soft'>
          <span className='fig-label'>Plate</span>
          {researchIndex.caption}
        </figcaption>
      </figure>

      <section aria-labelledby='index-heading' className='mt-12 md:mt-16'>
        <h2 id='index-heading' className='visually-hidden'>
          All posts
        </h2>
        <div className='flex flex-col gap-4 border-b border-ink pb-4 lg:flex-row lg:items-end lg:justify-between'>
          <div role='group' aria-label='Filter by topic' className='flex flex-wrap gap-2'>
            <FilterChip
              pressed={selected.size === 0}
              onClick={() => setTopics(new Set())}
              label='All'
              count={posts.length}
            />
            {TOPICS.map((topic) => (
              <FilterChip
                key={topic}
                pressed={selected.has(topicSlug(topic))}
                onClick={() => toggleTopic(topicSlug(topic))}
                label={topic}
                count={counts.get(topic) ?? 0}
              />
            ))}
          </div>
          <div className='relative w-full lg:w-[22rem]'>
            <label htmlFor='research-filter' className='visually-hidden'>
              {researchIndex.filterLabel}
            </label>
            <input
              ref={inputRef}
              id='research-filter'
              type='search'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={researchIndex.filterPlaceholder}
              autoComplete='off'
              spellCheck={false}
              className='h-11 w-full border-b border-ink-soft bg-transparent pr-9 text-[1rem] placeholder:text-ink-soft focus:border-ink focus:outline-none focus-visible:outline-none'
            />
            <kbd
              aria-hidden='true'
              className='mono absolute top-1/2 right-0 hidden -translate-y-1/2 border border-rule px-1.5 text-[0.7rem] text-ink-soft lg:block'
            >
              /
            </kbd>
          </div>
        </div>

        <p className='label mt-4 text-ink-soft' aria-live='polite' role='status'>
          {filtered
            ? `Showing ${visible.length} of ${posts.length} posts`
            : `${posts.length} posts`}
        </p>

        {visible.length > 0 ? (
          <table className='data-table mt-3'>
            <caption className='visually-hidden'>
              Research posts, newest first: date, title, authors, and topic.
            </caption>
            <thead>
              <tr>
                <th scope='col' className='w-[7.5rem] md:w-[9rem]'>
                  Date
                </th>
                <th scope='col'>Title</th>
                <th scope='col' className='hidden md:table-cell md:w-[16rem]'>
                  Authors
                </th>
                <th scope='col' className='hidden md:table-cell md:w-[9rem]'>
                  Topic
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((post) => (
                <tr key={post.slug} className='group'>
                  <td className='mono pt-[0.95rem] text-[0.8rem] whitespace-nowrap text-ink-soft'>
                    <time dateTime={post.date}>{formatDate(post.date, 'short')}</time>
                  </td>
                  <td>
                    <Link
                      to='/research/$slug'
                      params={{ slug: post.slug }}
                      className='text-[1.15rem] leading-snug decoration-accent decoration-1 underline-offset-4 group-hover:underline md:text-[1.25rem]'
                    >
                      {post.title}
                    </Link>
                    {!post.hasBody ? (
                      <span className='label ml-2 align-[0.15em] whitespace-nowrap text-accent'>
                        {comingSoon.replace('Full paper ', '')}
                      </span>
                    ) : null}
                    <p className='mt-1 text-[0.92rem] text-ink-soft md:hidden'>
                      {post.authors.join(', ')} · {post.topic}
                    </p>
                  </td>
                  <td className='hidden pt-[0.95rem] text-[0.95rem] leading-snug text-ink-soft md:table-cell'>
                    {post.authors.join(', ')}
                  </td>
                  <td className='label hidden pt-[1.05rem] text-ink-soft md:table-cell'>
                    {post.topic}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className='mt-6 border-y border-rule py-8'>
            <p className='text-ink-soft'>{researchIndex.empty}</p>
            <button
              type='button'
              className='btn btn-quiet mt-4'
              onClick={() => {
                setQuery('');
                void navigate({ search: {}, replace: true, resetScroll: false });
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  pressed,
  onClick,
  label,
  count
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type='button'
      aria-pressed={pressed}
      onClick={onClick}
      className={clsx(
        'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[0.98rem] transition-colors',
        pressed
          ? 'border-ink bg-ink text-paper'
          : 'border-rule text-ink hover:border-ink-soft'
      )}
    >
      {label}
      <span className={clsx('mono text-[0.72rem]', pressed ? 'text-paper/80' : 'text-ink-soft')}>
        {count}
      </span>
    </button>
  );
}
