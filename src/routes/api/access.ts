import { createFileRoute } from '@tanstack/react-router';
import { handleAccessRequest, type AccessResult } from '~/lib/access/rules';
import { clientIp, d1Store, getSalt, ownerMailer } from '~/lib/access/server';
import { siteConfig } from '~/site.config';

const MAX_BODY_BYTES = 16 * 1024;

const STATUS_CODES: Record<AccessResult['status'], number> = {
  ok: 200,
  duplicate: 200,
  invalid: 422,
  rate_limited: 429,
  error: 500
};

async function readBody(request: Request): Promise<unknown> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) return request.json();
  if (type.includes('form')) return Object.fromEntries(await request.formData());
  return {};
}

/**
 * POST /api/access: the research-access form. The page sends JSON; without
 * JavaScript the browser posts the form and is redirected back to it.
 */
export const Route = createFileRoute('/api/access')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
        const reply = (result: AccessResult) =>
          wantsJson
            ? Response.json(result, {
                status: STATUS_CODES[result.status],
                headers: { 'cache-control': 'no-store' }
              })
            : new Response(null, {
                status: 303,
                headers: { location: `/?access=${result.status}#access` }
              });

        const length = Number(request.headers.get('content-length') ?? 0);
        if (length > MAX_BODY_BYTES) {
          return reply({ status: 'invalid', errors: { intendedUse: 'That is too long to send.' } });
        }

        try {
          const body = await readBody(request);
          const result = await handleAccessRequest(body, {
            ip: clientIp(request),
            salt: await getSalt(),
            now: new Date(),
            store: d1Store,
            ownerEmail: siteConfig.ownerEmail,
            mailer: ownerMailer
          });
          return reply(result);
        } catch (error) {
          console.error('[access] request failed', error);
          return reply({ status: 'error' });
        }
      }
    }
  }
});
