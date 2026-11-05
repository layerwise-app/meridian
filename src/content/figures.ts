/**
 * Width ÷ height of each page's figure. The canvas and its pre-rendered still
 * (made by `pnpm share-images`) both use these, so they always line up.
 * Posts use `post`.
 */
export const figureAspects = {
  home: 1,
  research: 4,
  'meridian-3': 2,
  careers: 4,
  privacy: 4,
  terms: 4,
  'not-found': 5 / 2,
  post: 5 / 2
} as const;
