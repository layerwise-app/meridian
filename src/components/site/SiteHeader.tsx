import { Link, useRouterState } from '@tanstack/react-router';
import { useEffect, useId, useRef, useState } from 'react';
import { siteConfig } from '~/site.config';
import { CtaLink } from './CtaLink';
import { LogoMark } from './LogoMark';

export function SiteHeader() {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenOn(null);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const isCurrent = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className='sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur-[6px] supports-[backdrop-filter]:bg-paper/85'>
      <a
        href='#main'
        className='btn btn-ink absolute top-2 left-2 z-50 -translate-y-24 focus:translate-y-0'
      >
        Skip to content
      </a>
      <div className='page flex h-16 items-center justify-between gap-3'>
        <Link
          to='/'
          className='-ml-1 flex min-h-11 items-center gap-2.5 px-1'
          aria-label={`${siteConfig.company}, home`}
        >
          <LogoMark size={26} />
          <span className='text-[1.4rem] leading-none tracking-[-0.01em]'>
            {siteConfig.company}
          </span>
        </Link>

        <nav aria-label='Main' className='hidden items-center gap-1 md:flex'>
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              aria-current={isCurrent(item.href) ? 'page' : undefined}
              className='relative flex min-h-11 items-center px-3 text-[1.02rem] text-ink-soft transition-colors hover:text-ink aria-[current=page]:text-ink'
            >
              {item.label}
              {isCurrent(item.href) ? (
                <span
                  aria-hidden='true'
                  className='absolute right-3 bottom-2 left-3 h-px bg-accent'
                />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className='flex items-center gap-1.5'>
          <CtaLink className='hidden text-[0.95rem] sm:inline-flex' arrow={false} />
          <CtaLink className='text-[0.95rem] sm:hidden' arrow={false}>
            {siteConfig.cta.shortLabel}
          </CtaLink>
          <button
            ref={buttonRef}
            type='button'
            className='btn btn-quiet min-w-11 px-3 text-[0.95rem] md:hidden'
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen(!open)}
          >
            <span>{open ? 'Close' : 'Menu'}</span>
          </button>
        </div>
      </div>

      <div
        id={menuId}
        hidden={!open}
        className='border-t border-rule bg-paper md:hidden'
      >
        <nav aria-label='Menu' className='page py-3'>
          <ul>
            {[{ label: 'Home', href: '/' }, ...siteConfig.nav].map((item) => (
              <li key={item.href} className='border-b border-rule last:border-b-0'>
                <Link
                  to={item.href}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className='flex min-h-13 items-center justify-between text-[1.25rem] aria-[current=page]:text-accent'
                >
                  {item.label}
                  <span aria-hidden='true' className='mono text-sm text-ink-soft'>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
