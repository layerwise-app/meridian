import { createFileRoute } from '@tanstack/react-router';
import { siteUrl } from '~/lib/site';

// The API stays out of search. Pages that shouldn't show in results use
// `seo({ noindex: true })` instead.
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          [
            'User-agent: *',
            'Disallow: /api/',
            '',
            `Sitemap: ${siteUrl('/sitemap.xml')}`,
            ''
          ].join('\n'),
          { headers: { 'content-type': 'text/plain; charset=utf-8' } }
        )
    }
  }
});
