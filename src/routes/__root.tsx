/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute
} from '@tanstack/react-router';
import type * as React from 'react';
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary';
import { NotFound } from '~/components/NotFound';
import { SiteFooter } from '~/components/site/SiteFooter';
import { SiteHeader } from '~/components/site/SiteHeader';
import { site } from '~/lib/site';
import { fontPreloads, themeCss } from '~/lib/theme';
import { siteConfig } from '~/site.config';
import { seo } from '~/utils/seo';
import '~/styles/app.css';

export const Route = createRootRoute({
  // Site-wide defaults; each page's `seo()` overrides tags with the same name.
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: siteConfig.colors.paper },
      ...(site.googleSiteVerification
        ? [
            {
              name: 'google-site-verification',
              content: site.googleSiteVerification
            }
          ]
        : []),
      ...seo({ title: site.name, description: site.description }).meta
    ],
    links: [
      ...fontPreloads.map((href) => ({
        rel: 'preload',
        href,
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous' as const
      })),
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' }
    ],
    styles: [{ children: themeCss }]
  }),
  errorComponent: (props) => (
    <RootDocument>
      <DefaultCatchBoundary {...props} />
    </RootDocument>
  ),
  notFoundComponent: () => <NotFound />,
  component: RootComponent
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <HeadContent />
      </head>
      <body>
        <SiteHeader />
        <main id='main' tabIndex={-1} className='outline-none'>
          {children}
        </main>
        <SiteFooter />
        <Scripts />
      </body>
    </html>
  );
}
