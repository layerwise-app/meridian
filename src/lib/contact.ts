import type { ContactCopy } from '~/content/types';
import { siteConfig } from '~/site.config';

/** The public address from `siteConfig.email`, or '' while it's unset. */
export const contactEmail = siteConfig.email.trim();

/**
 * Resolves copy that may mention the public address: the address is filled
 * in when it's set, and the fallback (or nothing) is used until then.
 */
export function contactCopy(copy: string | ContactCopy): string | null {
  if (typeof copy === 'string') return copy;
  if (contactEmail) return copy.withEmail.replaceAll('{contact}', contactEmail);
  return copy.withoutEmail ?? null;
}
