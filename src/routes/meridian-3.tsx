import { createFileRoute, Link } from '@tanstack/react-router';
import { ScreenSlot } from '~/components/figure/ScreenSlot';
import { EvalTable } from '~/components/model/EvalTable';
import { CtaLink } from '~/components/site/CtaLink';
import { figureAspects } from '~/content/figures';
import { modelCard } from '~/content/model-card';
import { shareImage } from '~/lib/share';
import { softwareApplicationLd } from '~/lib/structured-data';
import { siteConfig } from '~/site.config';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/meridian-3')({
  head: () =>
    seo({
      title: `${modelCard.name} model card — ${siteConfig.company}`,
      description:
        'Context length, modalities, training cutoff, intended uses, known limitations, and eight evaluations for Meridian 3, with notes on every benchmark.',
      path: '/meridian-3',
      ...shareImage('meridian-3'),
      jsonLd: softwareApplicationLd()
    }),
  component: ModelCardPage
});

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'intended-uses', label: 'Intended uses' },
  { id: 'limitations', label: 'Known limitations' },
  { id: 'evaluations', label: 'Evaluations' },
  { id: 'access', label: 'Access' }
];

function ModelCardPage() {
  return (
    <div className='page pt-12 md:pt-20'>
      <header className='section-grid'>
        <p className='label flex flex-wrap gap-x-3 gap-y-1 pt-2 text-accent xl:flex-col'>
          <span>{modelCard.kicker}</span>
          <span className='text-ink-soft normal-case'>{modelCard.version}</span>
        </p>
        <div className='max-w-[50rem]'>
          <h1 className='text-[2.8rem] leading-none tracking-[-0.02em] md:text-[4.4rem]'>
            {modelCard.title}
          </h1>
          <p className='mt-6 text-[1.15rem] leading-relaxed text-ink-soft md:text-[1.3rem]'>
            {modelCard.standfirst}
          </p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <CtaLink />
            <Link to='/research/$slug' params={{ slug: 'a-public-test-set-we-promise-not-to-train-on' }} className='btn btn-quiet'>
              About the held-out test set
            </Link>
          </div>
        </div>
      </header>

      <figure className='mt-12 md:mt-16'>
        <ScreenSlot
          screen={modelCard.screen}
          aspect={figureAspects['meridian-3']}
          label='A wide field of fine contour lines, drifting slowly.'
          priority
          className='border-y border-ink'
        />
        <figcaption className='mt-2.5 text-[0.85rem] text-ink-soft'>
          <span className='fig-label'>Plate</span>
          {modelCard.figureCaption}
        </figcaption>
      </figure>

      <div className='section-grid mt-14 md:mt-20'>
        <nav aria-label='On this page' className='hidden xl:block'>
          <ol className='sticky top-[calc(var(--header-h)+2rem)] space-y-1'>
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className='flex min-h-9 items-baseline gap-2 text-[0.92rem] text-ink-soft hover:text-ink'>
                  <span className='mono text-[0.72rem] text-accent'>{i + 1}</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className='min-w-0 space-y-20 md:space-y-24'>
          <section id='overview' aria-labelledby='overview-title' className='scroll-mt-24'>
            <h2 id='overview-title' className='card-h2'>
              Overview
            </h2>
            <dl className='mt-6 grid border-t border-ink sm:grid-cols-2 lg:grid-cols-3'>
              {modelCard.facts.map((fact) => (
                <div key={fact.label} className='border-b border-rule py-4 sm:pr-6'>
                  <dt className='label text-ink-soft'>{fact.label}</dt>
                  <dd className='mt-1.5 text-[1.1rem] leading-snug'>{fact.value}</dd>
                </div>
              ))}
            </dl>
            <p className='mt-6 max-w-(--measure) text-ink-soft'>
              {modelCard.summary.join(' ')}
            </p>
          </section>

          <section id='intended-uses' aria-labelledby='uses-title' className='scroll-mt-24'>
            <div className='grid gap-10 lg:grid-cols-2 lg:gap-14'>
              <div>
                <h2 id='uses-title' className='card-h2'>
                  Intended uses
                </h2>
                <NumberedList items={modelCard.intendedUses} />
              </div>
              <div>
                <h3 className='card-h2'>Out of scope</h3>
                <NumberedList items={modelCard.outOfScope} />
              </div>
            </div>
          </section>

          <section id='limitations' aria-labelledby='limitations-title' className='scroll-mt-24'>
            <h2 id='limitations-title' className='card-h2'>
              Known limitations
            </h2>
            <p className='mt-3 max-w-(--measure) text-ink-soft'>
              What we know to be wrong with it. Each was found in our own evaluations; we expect
              researchers with access to find more.
            </p>
            <NumberedList items={modelCard.limitations} wide />
          </section>

          <section id='evaluations' aria-labelledby='evals-title' className='scroll-mt-24'>
            <h2 id='evals-title' className='card-h2'>
              Evaluations
            </h2>
            <p className='mt-3 max-w-(--measure) text-ink-soft'>{modelCard.evaluationNote}</p>
            <div className='mt-8'>
              <EvalTable
                evaluations={modelCard.evaluations}
                columns={modelCard.columns}
                caption='Meridian 3 against Meridian 2 and two frontier baselines. Select a column heading to sort.'
                idPrefix='card-eval'
              />
            </div>
          </section>

          <section id='access' aria-labelledby='access-title' className='scroll-mt-24 border-t border-ink pt-8'>
            <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end'>
              <div>
                <h2 id='access-title' className='card-h2'>
                  Access
                </h2>
                <p className='mt-3 max-w-(--measure) text-ink-soft'>
                  Meridian 3 is available to researchers by application. Approved projects receive
                  API access, the evaluation code, and the research licence.
                </p>
              </div>
              <CtaLink />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function NumberedList({ items, wide }: { items: string[]; wide?: boolean }) {
  return (
    <ol className={wide ? 'mt-6 grid gap-x-12 border-t border-ink md:grid-cols-2' : 'mt-6 border-t border-ink'}>
      {items.map((item, i) => (
        <li key={item} className='grid grid-cols-[2rem_minmax(0,1fr)] border-b border-rule py-4'>
          <span className='mono pt-1 text-[0.75rem] text-accent'>{String(i + 1).padStart(2, '0')}</span>
          <span className='leading-relaxed'>{item}</span>
        </li>
      ))}
    </ol>
  );
}
