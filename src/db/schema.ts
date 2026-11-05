import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// Authentication tables from the Layerwise starter. This site has no accounts,
// so nothing reads or writes them; they stay so existing databases migrate
// without dropping tables.

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  role: text('role'),
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp' })
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by')
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', {
    mode: 'timestamp'
  }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', {
    mode: 'timestamp'
  }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  )
});

// ---------------------------------------------------------------------------
// Research access requests (the sign-up form on Home).

/** One row per email address. Submissions show up in Layerwise's Database panel. */
export const accessRequests = sqliteTable(
  'access_requests',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    /** Stored lowercased and trimmed, so the same address can't be added twice. */
    email: text('email').notNull().unique(),
    organization: text('organization').notNull(),
    intendedUse: text('intended_use').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    /** When the owner was emailed about this request; null if not emailed. */
    ownerNotifiedAt: integer('owner_notified_at', { mode: 'timestamp' })
  },
  (table) => [
    index('access_requests_owner_notified_at_idx').on(table.ownerNotifiedAt)
  ]
);

/**
 * Every submission attempt, keyed by a salted hash of the visitor's IP address
 * (never the address itself). Used for the 5-per-hour rate limit and pruned
 * after a day.
 */
export const accessAttempts = sqliteTable(
  'access_attempts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    visitorHash: text('visitor_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
  },
  (table) => [
    index('access_attempts_visitor_created_idx').on(
      table.visitorHash,
      table.createdAt
    )
  ]
);

/** Server-only values generated on first use, like the IP hashing salt. */
export const siteSecrets = sqliteTable('site_secrets', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
});
