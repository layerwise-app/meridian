import { createFileRoute, Link } from '@tanstack/react-router';
import { AccessForm, type FallbackStatus } from '~/components/access/AccessForm';
import { ScreenSlot } from '~/components/figure/ScreenSlot';
import { EvalTable } from '~/components/model/EvalTable';
import { CtaLink } from '~/components/site/CtaLink';
import { SectionHead } from '~/components/site/SectionHead';
import { careers } from '~/content/careers';
import { figureAspects } from '~/content/figures';
import { home } from '~/content/home';
import { modelCard } from '~/content/model-card';
import { listPosts } from '~/lib/posts.functions';
import { formatDate, listNames, shareImage } from '~/lib/share';
import { organizationLd, softwareApplicationLd, websiteLd } from '~/lib/structured-data';
import { seo } from '~/utils/seo';

const STATUSES: FallbackStatus[] = ['ok', 'duplicate', 'invalid', 'rate_limited', 'error'];

export const Route = createFileRoute('/')({
  // `?access=` is set only when the form was posted without JavaScript.
  validateSearch: (search: Record<string, unknown>): { access?: FallbackStatus } =>
    STATUSES.includes(search.access as FallbackStatus)
      ? { access: search.access as FallbackStatus }
      : {},
  loader: async () => (await listPosts()).slice(0, home.research.count),
  head: () =>
    seo({
      title: home.seo.title,
      description: home.seo.description,
      path: '/',
      ...shareImage('home'),
      jsonLd: [organizationLd(), websiteLd(), softwareApplicationLd()]
    }),
  component: Home
});

function Home() {
  const latest = Route.useLoaderData();
  const { access } = Route.useSearch();
  const { statement, model, research, principles } = home;

  return (
    <>
      {/* 1. Statement */}
      <section aria-labelledby='statement' className='page pt-10 md:pt-16 xl:pt-20'>
        <div className='grid items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14 xl:gap-20'>
          <div className='lg:pt-4'>
            <p className='label text-accent'>{statement.kicker}</p>
            <h1
              id='statement'
              className='mt-5 text-[2.4rem] leading-[1.05] tracking-[-0.02em] sm:text-[3rem] md:text-[3.6rem] xl:text-[4.5rem]'
            >
              {statement.headline}
            </h1>
            <p className='mt-7 max-w-[38rem] text-[1.12rem] leading-relaxed text-ink-soft md:text-[1.28rem]'>
              {statement.body}
            </p>
            <div className='mt-9 flex flex-wrap gap-3'>
              <CtaLink />
              <Link to={statement.secondary.href} className='btn btn-quiet'>
                {statement.secondary.label}
              </Link>
            </div>
          </div>
          <figure>
            <ScreenSlot
              screen={statement.screen}
              aspect={figureAspects.home}
              label={statement.figureLabel}
              priority
              className='border border-ink'
            />
            <figcaption className='mt-3 text-[0.88rem] leading-snug text-ink-soft'>
              <span className='fig-label'>Fig. 1</span>
              {statement.caption}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 2. Meridian 3 */}
      <section id='meridian-3' aria-labelledby='model-title' className='page mt-24 md:mt-32'>
        <div className='section-grid border-t border-ink pt-5'>
          <SectionHead number={model.number} kicker={model.kicker} />
          <div className='grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14'>
            <div>
              <h2 id='model-title' className='text-[2.5rem] leading-none tracking-[-0.015em] md:text-[3.4rem]'>
                {model.title}
              </h2>
              <p className='mt-6 text-[1.1rem] leading-relaxed md:text-[1.18rem]'>
                {modelCard.summary.join(' ')}
              </p>
              <dl className='mt-7 grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2 border-t border-rule pt-4 text-[0.95rem]'>
                {modelCard.facts.slice(0, 3).map((fact) => (
                  <div key={fact.label} className='contents'>
                    <dt className='label pt-1 text-ink-soft'>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <div className='mt-8 flex flex-wrap gap-3'>
                <CtaLink />
                <Link to={model.modelCardLink.href} className='btn btn-quiet'>
                  {model.modelCardLink.label}
                </Link>
              </div>
            </div>
            <div className='min-w-0 lg:pt-2'>
              <EvalTable
                evaluations={modelCard.evaluations.slice(0, modelCard.homeRows)}
                columns={modelCard.columns}
                caption={model.tableCaption}
                idPrefix='home-eval'
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Latest research */}
      <section aria-labelledby='research-title' className='page mt-24 md:mt-32'>
        <div className='section-grid border-t border-ink pt-5'>
          <SectionHead number={research.number} kicker='Research' />
          <div>
            <div className='flex flex-wrap items-baseline justify-between gap-4'>
              <h2 id='research-title' className='text-[2.2rem] leading-tight md:text-[2.8rem]'>
                {research.title}
              </h2>
              <Link to={research.allLink.href} className='link mono inline-flex min-h-11 items-center text-[0.85rem]'>
                {research.allLink.label} →
              </Link>
            </div>
            <ol className='mt-6'>
              {latest.map((post) => (
                <li
                  key={post.slug}
                  className='grid gap-x-10 gap-y-2 border-t border-rule py-7 first:border-t-ink md:grid-cols-[10rem_minmax(0,1fr)]'
                >
                  <p className='label flex gap-3 text-ink-soft md:flex-col md:gap-1.5 md:pt-2'>
                    <time dateTime={post.date}>{formatDate(post.date, 'short')}</time>
                    <span className='text-accent'>{post.topic}</span>
                  </p>
                  <div className='max-w-[46rem]'>
                    <h3 className='text-[1.5rem] leading-tight md:text-[1.85rem]'>
                      <Link
                        to='/research/$slug'
                        params={{ slug: post.slug }}
                        className='decoration-accent decoration-1 underline-offset-[0.18em] hover:underline'
                      >
                        {post.title}
                      </Link>
                    </h3>
                    <p className='mt-3 line-clamp-3 text-ink-soft'>{post.abstract}</p>
                    <p className='mt-3 text-[0.92rem] text-ink-soft'>
                      {listNames(post.authors)} · {post.readingMinutes} min read
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 4. How we work */}
      <section aria-labelledby='principles-title' className='page mt-24 md:mt-32'>
        <div className='section-grid border-t border-ink pt-5'>
          <SectionHead number={principles.number} kicker='Practice' />
          <div>
            <h2 id='principles-title' className='text-[2.2rem] leading-tight md:text-[2.8rem]'>
              {principles.title}
            </h2>
            <ol className='mt-8 max-w-(--measure)'>
              {principles.items.map((item, i) => (
                <li key={item.title} className='border-t border-rule py-6 first:border-t-0 first:pt-0'>
                  <p className='text-[1.12rem] leading-relaxed'>
                    <span className='mono mr-3 text-[0.8rem] text-accent'>{toRoman(i + 1)}.</span>
                    <strong className='font-medium'>{item.title}</strong> {item.body}
                    <a href={`#principle-note-${i + 1}`} className='sn-ref'>
                      <span className='visually-hidden'>Note </span>
                      {i + 1}
                    </a>
                    <span className='sidenote' role='note'>
                      <span className='sn-num'>{i + 1}</span>
                      {item.sidenote}
                    </span>
                  </p>
                  <ol className='sn-footnotes' aria-label='Note'>
                    <li id={`principle-note-${i + 1}`}>
                      <span className='sn-num'>{i + 1}</span>
                      <span>{item.sidenote}</span>
                    </li>
                  </ol>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 5. Careers */}
      <section aria-labelledby='careers-title' className='page mt-24 md:mt-32'>
        <div className='section-grid border-t border-ink pt-5'>
          <SectionHead number={home.careers.number} kicker='Join us' />
          <div>
            <div className='flex flex-wrap items-baseline justify-between gap-4'>
              <h2 id='careers-title' className='text-[2.2rem] leading-tight md:text-[2.8rem]'>
                {home.careers.title}
              </h2>
              <Link to={home.careers.allLink.href} className='link mono inline-flex min-h-11 items-center text-[0.85rem]'>
                {home.careers.allLink.label} →
              </Link>
            </div>
            <p className='mt-4 max-w-[40rem] text-ink-soft'>{home.careers.intro}</p>
            <ul className='mt-8 border-t border-ink'>
              {careers.roles.map((role) => (
                <li key={role.id} className='border-b border-rule'>
                  <Link
                    to='/careers'
                    hash={role.id}
                    className='group grid min-h-14 items-baseline gap-x-8 gap-y-1 py-4 md:grid-cols-[minmax(0,1fr)_12rem_13rem_1.5rem]'
                  >
                    <span className='text-[1.2rem] leading-snug group-hover:text-accent md:text-[1.3rem]'>
                      {role.title}
                    </span>
                    <span className='label text-ink-soft'>{role.team}</span>
                    <span className='text-[0.95rem] text-ink-soft'>{role.location}</span>
                    <span aria-hidden='true' className='mono hidden text-ink-soft transition-transform group-hover:translate-x-0.5 md:block'>
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Research access */}
      <section id='access' aria-labelledby='access-title' className='page mt-24 scroll-mt-16 md:mt-32'>
        <div className='section-grid border-t border-ink pt-5'>
          <SectionHead number={home.access.number} kicker='Access' />
          <div className='grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-14'>
            <div>
              <h2 id='access-title' className='text-[2.2rem] leading-tight md:text-[2.8rem]'>
                {home.access.title}
              </h2>
              <p className='mt-5 text-ink-soft'>{home.access.intro}</p>
            </div>
            <AccessForm fallbackStatus={access} />
          </div>
        </div>
      </section>
    </>
  );
}

function toRoman(n: number) {
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n - 1] ?? String(n);
}
