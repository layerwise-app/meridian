import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { siteConfig } from '~/site.config';
import { clsx } from 'clsx';

/**
 * Every "Request research access" button: a link to the form on Home.
 */
export function CtaLink({
  children,
  className,
  variant = 'ink',
  arrow = true
}: {
  children?: ReactNode;
  className?: string;
  variant?: 'ink' | 'quiet';
  arrow?: boolean;
}) {
  const [path, hash] = siteConfig.cta.href.split('#');
  return (
    <Link
      to={path || '/'}
      hash={hash}
      className={clsx('btn', variant === 'ink' ? 'btn-ink' : 'btn-quiet', className)}
    >
      {children ?? siteConfig.cta.label}
      {arrow ? (
        <span className='arrow' aria-hidden='true'>
          →
        </span>
      ) : null}
    </Link>
  );
}
