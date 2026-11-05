/**
 * Rules for the research-access form, kept free of the database and email
 * so they can be tested directly (see `tests/access.test.ts`).
 */

export const FIELD_LIMITS = {
  name: 120,
  email: 254,
  organization: 160,
  intendedUse: 500
} as const;

export const MIN_INTENDED_USE = 10;

/** At most this many submissions per visitor in `RATE_WINDOW_MS`. */
export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 60 * 60 * 1000;

/** At most this many owner notifications per UTC day; requests are still saved past it. */
export const OWNER_EMAIL_DAILY_CAP = 100;

/** Attempt records older than this are deleted. */
export const ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000;

export type Field = 'name' | 'email' | 'organization' | 'intendedUse';
export type FieldErrors = Partial<Record<Field, string>>;

export type AccessInput = Record<Field, string> & {
  /** Honeypot: hidden from people, so anything in it came from a bot. */
  website: string;
};

export type AccessRequest = Record<Field, string>;

export type AccessResult =
  | { status: 'ok' }
  | { status: 'duplicate' }
  | { status: 'invalid'; errors: FieldErrors }
  | { status: 'rate_limited' }
  | { status: 'error' };

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

const asText = (value: unknown) => (typeof value === 'string' ? value : '');

/** Single-line fields lose control characters and runs of whitespace. */
const oneLine = (value: string) =>
  // oxlint-disable-next-line no-control-regex -- stripping control characters is the point
  value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();

/** The intended-use box keeps line breaks but nothing else invisible. */
const multiLine = (value: string) =>
  value
    .replace(/\r\n?/g, '\n')
    // oxlint-disable-next-line no-control-regex -- stripping control characters is the point
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export function normalizeInput(raw: unknown): AccessInput {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    name: oneLine(asText(source.name)),
    email: oneLine(asText(source.email)).toLowerCase(),
    organization: oneLine(asText(source.organization)),
    intendedUse: multiLine(asText(source.intendedUse)),
    website: asText(source.website).trim()
  };
}

/** Counts characters the way people do (an emoji is one), matching the live counter. */
export const charCount = (value: string) => [...value].length;

export function validate(
  input: AccessInput
): { ok: true; value: AccessRequest } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  if (!input.name) errors.name = 'Please enter your name.';
  else if (charCount(input.name) > FIELD_LIMITS.name)
    errors.name = `Please keep your name under ${FIELD_LIMITS.name} characters.`;

  if (!input.email) errors.email = 'Please enter your email address.';
  else if (input.email.length > FIELD_LIMITS.email || !EMAIL_PATTERN.test(input.email))
    errors.email = 'Please enter a valid email address, like ada@example.org.';

  if (!input.organization)
    errors.organization = 'Please enter your organisation, or “Independent”.';
  else if (charCount(input.organization) > FIELD_LIMITS.organization)
    errors.organization = `Please keep this under ${FIELD_LIMITS.organization} characters.`;

  const used = charCount(input.intendedUse);
  if (used < MIN_INTENDED_USE)
    errors.intendedUse = 'Please tell us a little about what you would study.';
  else if (used > FIELD_LIMITS.intendedUse)
    errors.intendedUse = `Please keep this to ${FIELD_LIMITS.intendedUse} characters; it is ${used} now.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name: input.name,
      email: input.email,
      organization: input.organization,
      intendedUse: input.intendedUse
    }
  };
}

/** SHA-256 of salt and IP address, as hex. The address itself is never kept. */
export async function hashVisitor(ip: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}\u0000${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function startOfUtcDay(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Storage the rules need. `src/lib/access/server.ts` implements it with D1. */
export type AccessStore = {
  pruneAttempts(before: Date): Promise<void>;
  countAttempts(visitorHash: string, since: Date): Promise<number>;
  recordAttempt(visitorHash: string, at: Date): Promise<void>;
  /** Inserts unless the email exists; `id` is set only when a row was added. */
  insertRequest(request: AccessRequest, at: Date): Promise<{ id: string | null }>;
  countNotifiedSince(since: Date): Promise<number>;
  markNotified(id: string, at: Date): Promise<void>;
};

export type OwnerMessage = { to: string; subject: string; text: string; html: string };
export type Mailer = (message: OwnerMessage) => Promise<{ ok: boolean }>;

export type AccessContext = {
  ip: string;
  salt: string;
  now: Date;
  store: AccessStore;
  /** Empty disables owner email. */
  ownerEmail: string;
  mailer: Mailer;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** The notification sent to the site owner. It always goes to `ownerEmail`, never the visitor. */
export function ownerMessage(request: AccessRequest, ownerEmail: string, at: Date): OwnerMessage {
  const subject = `Research access request: ${request.name} (${request.organization})`.slice(0, 200);
  const lines: [string, string][] = [
    ['Name', request.name],
    ['Email', request.email],
    ['Organisation', request.organization],
    ['Intended use', request.intendedUse],
    ['Received', at.toISOString()]
  ];
  return {
    to: ownerEmail,
    subject,
    text: `${lines.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nAll requests are in the access_requests table in your project's Database panel.`,
    html: `<p>A new request for research access.</p><table cellpadding="4">${lines
      .map(
        ([k, v]) =>
          `<tr><td valign="top"><strong>${k}</strong></td><td>${escapeHtml(v).replace(/\n/g, '<br>')}</td></tr>`
      )
      .join('')}</table><p>All requests are in the <code>access_requests</code> table in your project’s Database panel.</p>`
  };
}

/**
 * Handles one submission: rate limit, honeypot, validation, de-duplication,
 * then (when configured and under the daily cap) an email to the owner.
 */
export async function handleAccessRequest(
  raw: unknown,
  ctx: AccessContext
): Promise<AccessResult> {
  const visitor = await hashVisitor(ctx.ip || 'unknown', ctx.salt);
  const now = ctx.now;

  await ctx.store.pruneAttempts(new Date(now.getTime() - ATTEMPT_RETENTION_MS));
  const recent = await ctx.store.countAttempts(visitor, new Date(now.getTime() - RATE_WINDOW_MS));
  if (recent >= RATE_LIMIT) return { status: 'rate_limited' };
  await ctx.store.recordAttempt(visitor, now);

  const input = normalizeInput(raw);
  // Bots get a normal-looking answer, and nothing is saved.
  if (input.website) return { status: 'ok' };

  const checked = validate(input);
  if (!checked.ok) return { status: 'invalid', errors: checked.errors };

  const { id } = await ctx.store.insertRequest(checked.value, now);
  if (!id) return { status: 'duplicate' };

  if (ctx.ownerEmail) {
    try {
      const sentToday = await ctx.store.countNotifiedSince(startOfUtcDay(now));
      if (sentToday < OWNER_EMAIL_DAILY_CAP) {
        const result = await ctx.mailer(ownerMessage(checked.value, ctx.ownerEmail, now));
        if (result.ok) await ctx.store.markNotified(id, now);
      }
    } catch (error) {
      // The request is saved; a failed notification must not fail it.
      console.warn('[access] owner notification failed', error);
    }
  }
  return { status: 'ok' };
}
