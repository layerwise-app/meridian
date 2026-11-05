import { describe, expect, it } from 'vitest';
import {
  FIELD_LIMITS,
  OWNER_EMAIL_DAILY_CAP,
  RATE_LIMIT,
  handleAccessRequest,
  hashVisitor,
  normalizeInput,
  validate,
  type AccessContext,
  type AccessRequest,
  type AccessStore,
  type OwnerMessage
} from '~/lib/access/rules';

/** An in-memory stand-in for the D1 tables. */
function memoryStore() {
  const attempts: { visitorHash: string; at: Date }[] = [];
  const requests: (AccessRequest & { id: string; at: Date; notifiedAt: Date | null })[] = [];
  let nextId = 1;
  const store: AccessStore = {
    async pruneAttempts(before) {
      for (let i = attempts.length - 1; i >= 0; i--) {
        if (attempts[i].at < before) attempts.splice(i, 1);
      }
    },
    async countAttempts(visitorHash, since) {
      return attempts.filter((a) => a.visitorHash === visitorHash && a.at >= since).length;
    },
    async recordAttempt(visitorHash, at) {
      attempts.push({ visitorHash, at });
    },
    async insertRequest(request, at) {
      if (requests.some((r) => r.email === request.email)) return { id: null };
      const id = String(nextId++);
      requests.push({ ...request, id, at, notifiedAt: null });
      return { id };
    },
    async countNotifiedSince(since) {
      return requests.filter((r) => r.notifiedAt && r.notifiedAt >= since).length;
    },
    async markNotified(id, at) {
      const row = requests.find((r) => r.id === id);
      if (row) row.notifiedAt = at;
    }
  };
  return { store, attempts, requests };
}

const valid = {
  name: 'Ada Lovelace',
  email: 'Ada@Example.org',
  organization: 'Analytical Engines Society',
  intendedUse: 'Studying calibrated abstention on long documents.',
  website: ''
};

function setup(overrides: Partial<AccessContext> = {}) {
  const memory = memoryStore();
  const sent: OwnerMessage[] = [];
  const ctx: AccessContext = {
    ip: '203.0.113.7',
    salt: 'test-salt',
    now: new Date('2026-11-05T10:00:00Z'),
    store: memory.store,
    ownerEmail: '',
    mailer: async (message) => {
      sent.push(message);
      return { ok: true };
    },
    ...overrides
  };
  return { ...memory, sent, ctx };
}

describe('validation', () => {
  it('accepts a complete request and normalises it', () => {
    const result = validate(normalizeInput({ ...valid, name: '  Ada   Lovelace ' }));
    expect(result).toMatchObject({
      ok: true,
      value: { name: 'Ada Lovelace', email: 'ada@example.org' }
    });
  });

  it('requires every field', () => {
    const result = validate(normalizeInput({}));
    expect(result).toMatchObject({
      ok: false,
      errors: {
        name: expect.any(String),
        email: expect.any(String),
        organization: expect.any(String),
        intendedUse: expect.any(String)
      }
    });
  });

  it('rejects malformed email addresses', () => {
    const accepted = ['ada', 'ada@', 'ada@example', 'a b@example.org', 'ada@@example.org'].filter(
      (email) => validate(normalizeInput({ ...valid, email })).ok
    );
    expect(accepted).toEqual([]);
  });

  it('allows exactly 500 characters of intended use, and not 501', () => {
    const at = validate(normalizeInput({ ...valid, intendedUse: 'x'.repeat(FIELD_LIMITS.intendedUse) }));
    const over = validate(normalizeInput({ ...valid, intendedUse: 'x'.repeat(FIELD_LIMITS.intendedUse + 1) }));
    expect(at.ok).toBe(true);
    expect(over.ok).toBe(false);
  });

  it('counts an emoji as one character, like the live counter', () => {
    const text = '🔬'.repeat(FIELD_LIMITS.intendedUse);
    expect(validate(normalizeInput({ ...valid, intendedUse: text })).ok).toBe(true);
  });

  it('ignores non-string input instead of throwing', () => {
    expect(validate(normalizeInput({ name: 42, email: ['x'], organization: null })).ok).toBe(false);
    expect(validate(normalizeInput(null)).ok).toBe(false);
  });
});

describe('handleAccessRequest', () => {
  it('saves a valid request', async () => {
    const { ctx, requests } = setup();
    expect(await handleAccessRequest(valid, ctx)).toEqual({ status: 'ok' });
    expect(requests).toHaveLength(1);
    expect(requests[0].email).toBe('ada@example.org');
  });

  it('reports the same email twice as a duplicate and adds no row', async () => {
    const { ctx, requests } = setup();
    await handleAccessRequest(valid, ctx);
    const again = await handleAccessRequest({ ...valid, email: ' ADA@example.ORG ' }, ctx);
    expect(again).toEqual({ status: 'duplicate' });
    expect(requests).toHaveLength(1);
  });

  it('returns field errors for invalid input and saves nothing', async () => {
    const { ctx, requests } = setup();
    const result = await handleAccessRequest({ ...valid, email: 'nope' }, ctx);
    expect(result).toMatchObject({ status: 'invalid', errors: { email: expect.any(String) } });
    expect(requests).toHaveLength(0);
  });

  it('answers a filled honeypot like a success but saves nothing', async () => {
    const { ctx, requests, sent } = setup({ ownerEmail: 'owner@example.com' });
    const result = await handleAccessRequest({ ...valid, website: 'http://spam.example' }, ctx);
    expect(result).toEqual({ status: 'ok' });
    expect(requests).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it(`allows ${RATE_LIMIT} submissions per visitor per hour, then refuses`, async () => {
    const { ctx, requests } = setup();
    for (let i = 0; i < RATE_LIMIT; i++) {
      const result = await handleAccessRequest({ ...valid, email: `r${i}@example.org` }, ctx);
      expect(result.status).toBe('ok');
    }
    const blocked = await handleAccessRequest({ ...valid, email: 'late@example.org' }, ctx);
    expect(blocked).toEqual({ status: 'rate_limited' });
    expect(requests).toHaveLength(RATE_LIMIT);
  });

  it('counts invalid, duplicate, and honeypot attempts toward the limit', async () => {
    const { ctx } = setup();
    await handleAccessRequest(valid, ctx);
    await handleAccessRequest(valid, ctx);
    await handleAccessRequest({ ...valid, email: 'bad' }, ctx);
    await handleAccessRequest({ ...valid, website: 'x' }, ctx);
    await handleAccessRequest({ ...valid, email: 'b@example.org' }, ctx);
    expect(await handleAccessRequest({ ...valid, email: 'c@example.org' }, ctx)).toEqual({
      status: 'rate_limited'
    });
  });

  it('limits each visitor separately and resets after an hour', async () => {
    const { ctx } = setup();
    for (let i = 0; i < RATE_LIMIT; i++) {
      await handleAccessRequest({ ...valid, email: `a${i}@example.org` }, ctx);
    }
    const other = await handleAccessRequest(
      { ...valid, email: 'other@example.org' },
      { ...ctx, ip: '198.51.100.2' }
    );
    expect(other.status).toBe('ok');
    const later = await handleAccessRequest(
      { ...valid, email: 'later@example.org' },
      { ...ctx, now: new Date(ctx.now.getTime() + 60 * 60 * 1000 + 1) }
    );
    expect(later.status).toBe('ok');
  });

  it('stores only a salted hash of the IP address, never the address', async () => {
    const { ctx, attempts } = setup();
    await handleAccessRequest(valid, ctx);
    expect(attempts).toHaveLength(1);
    const stored = attempts[0].visitorHash;
    expect(stored).toMatch(/^[0-9a-f]{64}$/);
    expect(stored).not.toContain(ctx.ip);
    expect(stored).toBe(await hashVisitor(ctx.ip, ctx.salt));
    expect(stored).not.toBe(await hashVisitor(ctx.ip, 'another-salt'));
  });
});

describe('owner email', () => {
  it('sends nothing when ownerEmail is empty', async () => {
    const { ctx, sent } = setup();
    await handleAccessRequest(valid, ctx);
    expect(sent).toHaveLength(0);
  });

  it('emails the owner, never the visitor, and escapes what they typed', async () => {
    const { ctx, sent, requests } = setup({ ownerEmail: 'owner@example.com' });
    await handleAccessRequest({ ...valid, name: '<b>Ada</b>' }, ctx);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('owner@example.com');
    expect(sent[0].html).not.toContain('<b>Ada</b>');
    expect(sent[0].html).toContain('&#60;b&#62;Ada');
    expect(requests[0].notifiedAt).not.toBeNull();
  });

  it('does not email again for a duplicate', async () => {
    const { ctx, sent } = setup({ ownerEmail: 'owner@example.com' });
    await handleAccessRequest(valid, ctx);
    await handleAccessRequest(valid, ctx);
    expect(sent).toHaveLength(1);
  });

  it(`stops emailing after ${OWNER_EMAIL_DAILY_CAP} a day but keeps saving`, async () => {
    const { ctx, sent, requests } = setup({ ownerEmail: 'owner@example.com' });
    const total = OWNER_EMAIL_DAILY_CAP + 3;
    for (let i = 0; i < total; i++) {
      // A different visitor each time, so the rate limit doesn't interfere.
      await handleAccessRequest(
        { ...valid, email: `p${i}@example.org` },
        { ...ctx, ip: `10.0.${Math.floor(i / 250)}.${i % 250}` }
      );
    }
    expect(requests).toHaveLength(total);
    expect(sent).toHaveLength(OWNER_EMAIL_DAILY_CAP);
    // The next UTC day starts a fresh allowance.
    await handleAccessRequest(
      { ...valid, email: 'tomorrow@example.org' },
      { ...ctx, ip: '10.9.9.9', now: new Date('2026-11-06T00:00:01Z') }
    );
    expect(sent).toHaveLength(OWNER_EMAIL_DAILY_CAP + 1);
  });

  it('still saves the request when sending fails', async () => {
    const { ctx, requests } = setup({
      ownerEmail: 'owner@example.com',
      mailer: async () => {
        throw new Error('network down');
      }
    });
    expect(await handleAccessRequest(valid, ctx)).toEqual({ status: 'ok' });
    expect(requests).toHaveLength(1);
    expect(requests[0].notifiedAt).toBeNull();
  });
});
