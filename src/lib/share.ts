import share from '~/content/generated/share.json';

type ShareEntry = { src: string; alt: string };
const entries = share as Record<string, ShareEntry>;

/**
 * The 1200×630 share image for a page, made by `pnpm share-images`. Keys are
 * `home`, `research`, `meridian-3`, `careers`, `privacy`, `terms`, and
 * `post-<slug>`. Falls back to Home's image until the script has run.
 */
export function shareImage(key: string): { image?: string; imageAlt?: string } {
  const entry = entries[key] ?? entries.home;
  return entry ? { image: entry.src, imageAlt: entry.alt } : {};
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

/**
 * "5 November 2026" (or "5 Nov 2026" for `short`) from an ISO date. Written
 * out by hand so the server and every browser print the same text.
 */
export function formatDate(iso: string, style: 'long' | 'short' = 'long') {
  const [year, month, day] = iso.split('-').map(Number);
  const name = MONTHS[month - 1] ?? '';
  return `${day} ${style === 'long' ? name : name.slice(0, 3)} ${year}`;
}

/** "A, B, and C" */
export function listNames(names: string[]) {
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}
