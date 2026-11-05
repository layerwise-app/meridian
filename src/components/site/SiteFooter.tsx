import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { siteConfig } from '~/site.config';
import { LogoMark } from './LogoMark';

export function SiteFooter() {
  // Read during render, not at module load: Workers report the Unix epoch
  // outside a request, which printed 1970 on the server.
  const [year] = useState(() => new Date().getUTCFullYear());
  const social = siteConfig.social.filter((item) => item.href);
  const [ctaPath, ctaHash] = siteConfig.cta.href.split('#');
  return (
    <footer className='mt-28 border-t border-ink'>
      <div className='page grid gap-10 py-12 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] md:py-16'>
        <div className='max-w-sm'>
          <Link to='/' className='inline-flex min-h-11 items-center gap-2.5'>
            <LogoMark size={24} />
            <span className='text-[1.3rem] leading-none'>{siteConfig.company}</span>
          </Link>
          <p className='mt-3 text-[0.98rem] leading-relaxed text-ink-soft'>
            {siteConfig.tagline}
          </p>
          <p className='label mt-4 text-ink-soft'>
            {siteConfig.locations.join(' · ')}
          </p>
        </div>

        <nav aria-label='Site'>
          <h2 className='label text-ink-soft'>Read</h2>
          <ul className='mt-2'>
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link to={item.href} className='link inline-flex min-h-11 items-center'>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to={ctaPath || '/'}
                hash={ctaHash}
                className='link inline-flex min-h-11 items-center'
              >
                {siteConfig.cta.label}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className='label text-ink-soft'>Lab</h2>
          <ul className='mt-2'>
            <li>
              <Link to='/privacy' className='link inline-flex min-h-11 items-center'>
                Privacy
              </Link>
            </li>
            <li>
              <Link to='/terms' className='link inline-flex min-h-11 items-center'>
                Terms
              </Link>
            </li>
            {social.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className='link inline-flex min-h-11 items-center'
                  {...(item.href.startsWith('http')
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className='page flex flex-col gap-5 border-t border-rule py-6 sm:flex-row sm:items-center sm:justify-between'>
        <p className='label text-ink-soft'>
          © {year} {siteConfig.legalName} · Set in{' '}
          {siteConfig.fonts.serif.family} &amp; {siteConfig.fonts.mono.family}
        </p>
        <a
          href='https://layerwise.app'
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex min-h-11 items-center self-start sm:self-auto'
        >
          <img
            src='https://layerwise.app/powered-by.png'
            alt='Powered by Layerwise'
            width={174}
            height={28}
            loading='lazy'
            decoding='async'
          />
        </a>
      </div>
    </footer>
  );
}
