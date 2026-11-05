import { createFileRoute } from '@tanstack/react-router';
import { ScreenSlot } from '~/components/figure/ScreenSlot';
import { careers } from '~/content/careers';
import { figureAspects } from '~/content/figures';
import { shareImage } from '~/lib/share';
import { siteConfig } from '~/site.config';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/careers')({
  head: () =>
    seo({
      title: `Careers — ${siteConfig.company}`,
      description: `Five open roles at ${siteConfig.company} in Edinburgh and Montréal, across alignment, interpretability, reasoning, policy, and infrastructure.`,
      path: '/careers',
      ...shareImage('careers')
    }),
  component: CareersPage
});

function CareersPage() {
  const mail = (role?: string) =>
    `mailto:${careers.applyEmail}${role ? `?subject=${encodeURIComponent(role)}` : ''}`;
  return (
    <div className='page pt-12 md:pt-20'>
      <header className='section-grid'>
        <p className='label pt-2 text-accent'>{careers.kicker}</p>
        <div className='max-w-[52rem]'>
          <h1 className='text-[2.4rem] leading-[1.06] tracking-[-0.015em] md:text-[3.5rem]'>
            {careers.title}
          </h1>
          <p className='mt-6 max-w-(--measure) text-[1.1rem] leading-relaxed text-ink-soft'>
            {careers.intro}
          </p>
        </div>
      </header>

      <figure className='mt-12 md:mt-16'>
        <ScreenSlot
          screen={careers.screen}
          aspect={figureAspects.careers}
          label='A band of fine contour lines, drifting slowly.'
          priority
          className='border-y border-ink'
        />
        <figcaption className='mt-2.5 text-[0.85rem] text-ink-soft'>
          <span className='fig-label'>Plate</span>
          {careers.figureCaption}
        </figcaption>
      </figure>

      <div className='section-grid mt-14 md:mt-20'>
        <p className='label text-ink-soft xl:pt-3'>
          <span className='text-accent'>{careers.roles.length}</span> open roles
        </p>
        <div>
          <ol className='border-t border-ink'>
            {careers.roles.map((role, i) => (
              <li key={role.id} id={role.id} className='scroll-mt-24 border-b border-rule py-8 target:bg-paper-deep md:py-10'>
                <article className='grid gap-x-12 gap-y-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]'>
                  <div>
                    <p className='label text-ink-soft'>
                      <span className='text-accent'>{String(i + 1).padStart(2, '0')}</span> · {role.team}
                    </p>
                    <h2 className='mt-2 text-[1.6rem] leading-tight md:text-[1.9rem]'>{role.title}</h2>
                    <p className='mt-3 text-[0.95rem] text-ink-soft'>
                      {role.location} · {role.type}
                    </p>
                  </div>
                  <div>
                    <p className='max-w-(--measure) leading-relaxed'>{role.summary}</p>
                    <a href={mail(role.title)} className='link mono mt-4 inline-flex min-h-11 items-center text-[0.85rem] text-accent'>
                      Apply by email →
                    </a>
                  </div>
                </article>
              </li>
            ))}
          </ol>

          <section aria-labelledby='apply-title' className='mt-16 grid gap-8 bg-paper-deep px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12'>
            <div>
              <h2 id='apply-title' className='text-[1.9rem] leading-tight md:text-[2.3rem]'>
                {careers.applyTitle}
              </h2>
              <p className='mt-4'>
                <a href={mail()} className='link text-[1.15rem] text-accent'>
                  {careers.applyEmail}
                </a>
              </p>
            </div>
            <div>
              <ol className='space-y-3'>
                {careers.applySteps.map((step, i) => (
                  <li key={step} className='grid grid-cols-[2rem_minmax(0,1fr)]'>
                    <span className='mono pt-1 text-[0.75rem] text-accent'>{i + 1}</span>
                    <span className='leading-relaxed'>{step}</span>
                  </li>
                ))}
              </ol>
              <p className='mt-5 text-[0.95rem] text-ink-soft'>{careers.applyNote}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
