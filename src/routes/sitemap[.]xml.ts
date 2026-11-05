import { createFileRoute } from '@tanstack/react-router';
import { posts, postPath } from '~/content/posts';
import { sitemapPaths, siteUrl } from '~/lib/site';

// Lists `sitemapPaths` plus every research post.
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const entries = [
          ...sitemapPaths.map((path) => ({ path, lastmod: undefined })),
          ...posts.map((post) => ({ path: postPath(post.slug), lastmod: post.date }))
        ];
        const urls = entries
          .map(
            ({ path, lastmod }) =>
              `  <url><loc>${escapeXml(siteUrl(path))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`
          )
          .join('\n');
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
          { headers: { 'content-type': 'application/xml; charset=utf-8' } }
        );
      }
    }
  }
});

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
