import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useMemo } from 'react';
import { ArticleBody, References } from '~/components/article/Markdown';
import { indexArticle } from '~/components/article/parse';
import { ContentsInline, ContentsRail } from '~/components/article/TableOfContents';
import { ScreenSlot } from '~/components/figure/ScreenSlot';
import { CtaLink } from '~/components/site/CtaLink';
import { comingSoon } from '~/content/pages';
import { loadPost } from '~/lib/posts.functions';
import { formatDate, listNames, shareImage } from '~/lib/share';
import { articleLd } from '~/lib/structured-data';
import { siteConfig } from '~/site.config';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/research/$slug')({
  loader: async ({ params }) => {
    const data = await loadPost({ data: params.slug });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return seo({ title: `Not found — ${siteConfig.company}`, noindex: true });
    const { post } = loaderData;
    const share = shareImage(`post-${post.slug}`);
    return seo({
      title: `${post.title} — ${siteConfig.company}`,
      description: truncate(post.abstract, 158),
      path: `/research/${params.slug}`,
      type: 'article',
      ...share,
      jsonLd: articleLd(post, share.image)
    });
  },
  component: PostPage
});

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

function PostPage() {
  const { post, readingMinutes, newer, older } = Route.useLoaderData();
  const index = useMemo(() => indexArticle(post), [post]);
  const screen = post.screen ?? { kind: 'drawn' as const, seed: post.slug };

  return (
    <article className='page pt-10 md:pt-16'>
      <div className='post-frame'>
        <header className='post-head'>
          <p className='label flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft'>
            <Link
              to='/research'
              search={{ topic: post.topic.toLowerCase() }}
              className='link inline-flex min-h-11 items-center text-accent'
            >
              {post.topic}
            </Link>
            {/* Each separator travels with the item after it, so a wrapped
                line never ends on a dot. */}
            <span className='flex items-center gap-x-3'>
              <span aria-hidden='true'>·</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </span>
            <span className='flex items-center gap-x-3'>
              <span aria-hidden='true'>·</span>
              <span>{readingMinutes} min read</span>
            </span>
          </p>
          <h1 className='mt-2 text-[2.3rem] leading-[1.06] tracking-[-0.015em] md:text-[3.3rem] lg:text-[3.7rem]'>
            {post.title}
          </h1>
          <p className='mt-5 text-[1.05rem] text-ink-soft'>
            By <span className='text-ink'>{listNames(post.authors)}</span>
          </p>
        </header>

        <figure className='mt-10 md:mt-12'>
          <ScreenSlot
            screen={screen}
            aspect={5 / 2}
            label={`Contour field seeded “${screen.kind === 'drawn' ? screen.seed : post.slug}”.`}
            priority
            className='border-y border-ink'
          />
          <figcaption className='mt-2.5 flex justify-between gap-4 text-[0.85rem] text-ink-soft'>
            <span>
              <span className='fig-label'>Plate</span>
              {screen.kind === 'drawn' ? `Contour field, seeded “${screen.seed}”.` : screen.alt}
            </span>
          </figcaption>
        </figure>

        <div className='post-grid mt-10 md:mt-14'>
          <aside className='post-rail'>
            <ContentsRail items={index.toc} />
          </aside>

          <div className='post-main'>
            {index.toc.length > 0 ? (
              <div className='post-contents-inline mb-8'>
                <ContentsInline items={index.toc} />
              </div>
            ) : null}

            <section aria-labelledby='abstract' className='prose'>
              <h2 id='abstract' className='label !mt-0 text-ink-soft'>
                Abstract
              </h2>
              <p className='lede'>{post.abstract}</p>
            </section>

            {post.body ? (
              <>
                <div className='prose mt-10 border-t border-rule pt-2'>
                  <ArticleBody index={index} />
                </div>
                <div className='prose'>
                  <References index={index} />
                </div>
              </>
            ) : (
              <div className='prose mt-10 border-y border-rule py-6'>
                <p className='label text-accent'>{comingSoon}</p>
                <p className='mt-3 text-ink-soft'>
                  This post is an abstract for now. The full paper, with its figures and
                  evaluation code, will be published here.
                </p>
              </div>
            )}

            <aside className='mt-16 max-w-(--measure) bg-paper-deep px-5 py-6 md:px-7'>
              <p className='text-[1.05rem]'>
                Meridian 3 is available to researchers by application, with its model card
                and evaluation code.
              </p>
              <div className='mt-4 flex flex-wrap gap-3'>
                <CtaLink />
                <Link to='/meridian-3' className='btn btn-quiet'>
                  Model card
                </Link>
              </div>
            </aside>

            <nav aria-label='More research' className='mt-12 grid max-w-(--measure) gap-6 border-t border-ink pt-6 sm:grid-cols-2'>
              {newer ? (
                <Link to='/research/$slug' params={{ slug: newer.slug }} className='group block'>
                  <span className='label text-ink-soft'>← Newer</span>
                  <span className='mt-1 block text-[1.1rem] leading-snug group-hover:text-accent'>
                    {newer.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {older ? (
                <Link
                  to='/research/$slug'
                  params={{ slug: older.slug }}
                  className='group block sm:text-right'
                >
                  <span className='label text-ink-soft'>Older →</span>
                  <span className='mt-1 block text-[1.1rem] leading-snug group-hover:text-accent'>
                    {older.title}
                  </span>
                </Link>
              ) : null}
            </nav>
            <p className='mt-8'>
              <Link to='/research' className='link'>
                All research
              </Link>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
