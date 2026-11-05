import type { privacyPage } from '~/content/pages';
import { figureAspects } from '~/content/figures';
import { formatDate } from '~/lib/share';
import { ScreenSlot } from '~/components/figure/ScreenSlot';

type LegalContent = Pick<
  typeof privacyPage,
  'kicker' | 'title' | 'updated' | 'intro' | 'sections' | 'screen'
>;

/** Privacy and Terms share one plain layout. */
export function LegalPage({ page }: { page: LegalContent }) {
  return (
    <div className='page pt-12 md:pt-20'>
      <header className='section-grid'>
        <p className='label pt-2 text-accent'>{page.kicker}</p>
        <div className='max-w-(--measure)'>
          <h1 className='text-[2.4rem] leading-[1.06] tracking-[-0.015em] md:text-[3.4rem]'>
            {page.title}
          </h1>
          <p className='label mt-4 text-ink-soft'>
            Last updated <time dateTime={page.updated}>{formatDate(page.updated)}</time>
          </p>
          <p className='mt-6 text-[1.12rem] leading-relaxed'>{page.intro}</p>
        </div>
      </header>

      <figure className='mt-12 md:mt-14' aria-hidden='true'>
        <ScreenSlot
          screen={page.screen}
          aspect={figureAspects.privacy}
          label=''
          className='border-y border-ink'
        />
      </figure>

      <div className='section-grid mt-12 md:mt-16'>
        <span aria-hidden='true' />
        <div className='max-w-(--measure)'>
          {page.sections.map((section, i) => (
            <section key={section.heading} className='border-t border-rule py-7 first:border-t-ink'>
              <h2 className='flex items-baseline gap-3 text-[1.45rem] leading-tight'>
                <span className='mono text-[0.75rem] text-accent'>{String(i + 1).padStart(2, '0')}</span>
                {section.heading}
              </h2>
              <div className='mt-3 space-y-3 leading-relaxed'>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{linkEmails(paragraph)}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Turns plain addresses in legal copy into mailto links. */
function linkEmails(text: string) {
  const parts = text.split(/([\w.+-]+@[\w-]+\.[\w.]+?)(?=[.,]?(?:\s|$))/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={`mailto:${part}`} className='link text-accent'>
        {part}
      </a>
    ) : (
      part
    )
  );
}
