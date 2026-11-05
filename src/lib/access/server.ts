import { env } from 'cloudflare:workers';
import { and, count, eq, gte, isNotNull, lt } from 'drizzle-orm';
import { db } from '~/db';
import { accessAttempts, accessRequests, siteSecrets } from '~/db/schema';
import { siteConfig } from '~/site.config';
import type { AccessStore, Mailer } from './rules';

// Server only: the D1 store and the owner mailer behind `handleAccessRequest`.

export const d1Store: AccessStore = {
  async pruneAttempts(before) {
    await db.delete(accessAttempts).where(lt(accessAttempts.createdAt, before));
  },
  async countAttempts(visitorHash, since) {
    const [row] = await db
      .select({ n: count() })
      .from(accessAttempts)
      .where(
        and(eq(accessAttempts.visitorHash, visitorHash), gte(accessAttempts.createdAt, since))
      );
    return row?.n ?? 0;
  },
  async recordAttempt(visitorHash, at) {
    await db.insert(accessAttempts).values({ visitorHash, createdAt: at });
  },
  async insertRequest(request, at) {
    const rows = await db
      .insert(accessRequests)
      .values({ ...request, createdAt: at })
      .onConflictDoNothing({ target: accessRequests.email })
      .returning({ id: accessRequests.id });
    return { id: rows[0]?.id ?? null };
  },
  async countNotifiedSince(since) {
    const [row] = await db
      .select({ n: count() })
      .from(accessRequests)
      .where(and(isNotNull(accessRequests.ownerNotifiedAt), gte(accessRequests.ownerNotifiedAt, since)));
    return row?.n ?? 0;
  },
  async markNotified(id, at) {
    await db.update(accessRequests).set({ ownerNotifiedAt: at }).where(eq(accessRequests.id, id));
  }
};

/** Sends to the owner only; the recipient comes from site.config.ts. */
export const ownerMailer: Mailer = async (message) => {
  if (message.to !== siteConfig.ownerEmail) return { ok: false };
  const { error } = await env.EMAIL.send(message);
  if (error) {
    console.warn(`[access] owner email not sent: ${error.code} ${error.message}`);
    return { ok: false };
  }
  return { ok: true };
};

let cachedSalt: string | null = null;

/**
 * The salt for hashing IP addresses. Set an `IP_HASH_SALT` secret to choose
 * it; otherwise a random one is created in `site_secrets` on first use.
 */
export async function getSalt(): Promise<string> {
  const configured = (env as unknown as { IP_HASH_SALT?: string }).IP_HASH_SALT;
  if (configured) return configured;
  if (cachedSalt) return cachedSalt;
  const key = 'ip_hash_salt';
  const random = [...crypto.getRandomValues(new Uint8Array(32))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  await db.insert(siteSecrets).values({ key, value: random }).onConflictDoNothing();
  const [row] = await db
    .select({ value: siteSecrets.value })
    .from(siteSecrets)
    .where(eq(siteSecrets.key, key));
  cachedSalt = row?.value ?? random;
  return cachedSalt;
}

/** The visitor's address as Cloudflare reports it. Used only to compute the hash. */
export function clientIp(request: Request) {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    ''
  );
}
