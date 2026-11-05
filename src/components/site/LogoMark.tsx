/**
 * Meridian's mark: a globe outline with one meridian bowed across it, as if
 * the globe were turning. `public/logo.svg` is the same drawing on a paper
 * tile; after changing either, run `pnpm icons` to redraw the favicons.
 */
export function LogoMark({
  size = 28,
  className
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 64 64'
      aria-hidden='true'
      focusable='false'
      className={className}
    >
      <circle cx='32' cy='32' r='25' fill='none' stroke='var(--ink)' strokeWidth='5.5' />
      <path
        d='M32 7 C49 16 49 48 32 57'
        fill='none'
        stroke='var(--accent)'
        strokeWidth='5.5'
        strokeLinecap='round'
      />
    </svg>
  );
}
