/**
 * Shapes of the site's content. Content files import these with
 * `import type`, so they stay readable by plain Node scripts.
 */

export const TOPICS = [
  'Alignment',
  'Interpretability',
  'Reasoning',
  'Policy'
] as const;
export type Topic = (typeof TOPICS)[number];

/**
 * What fills a figure slot. `drawn` is the generative contour field, seeded
 * by any string. Swap it for an image processed by `pnpm add-images` (use its
 * name) or for a video file in `public/`.
 */
export type Screen =
  | { kind: 'drawn'; seed: string }
  | { kind: 'image'; image: string; alt: string }
  | { kind: 'video'; src: string; poster?: string; alt: string };

/**
 * Copy that mentions the site's public email address (`siteConfig.email`).
 * Once the address is set, `withEmail` is shown with `{contact}` replaced by
 * it; until then `withoutEmail` is shown, or nothing if it's left out.
 */
export type ContactCopy = { withEmail: string; withoutEmail?: string };

/** A margin note. Reference it in Markdown as `[^id]`. */
export type Sidenote = { id: string; text: string };

/** A reference. Cite it in Markdown as `[@key]`. */
export type Citation = {
  key: string;
  authors: string;
  title: string;
  venue: string;
  year: number;
  url?: string;
};

type FigureBase = {
  /** Place it in Markdown on its own line as `::figure[id]`. */
  id: string;
  /** One or two sentences. Figures are numbered automatically. */
  caption: string;
};

export type Series = { name: string; values: number[]; accent?: boolean };

export type FigureSpec =
  | (FigureBase & {
      kind: 'line';
      xLabel: string;
      yLabel: string;
      x: (string | number)[];
      series: Series[];
      yDomain: [number, number];
      /** Appended to y-axis tick labels, like `%`. */
      yUnit?: string;
    })
  | (FigureBase & {
      kind: 'bars';
      yLabel: string;
      categories: string[];
      series: Series[];
      yDomain: [number, number];
      yUnit?: string;
    })
  | (FigureBase & {
      kind: 'scatter';
      xLabel: string;
      yLabel: string;
      xDomain: [number, number];
      yDomain: [number, number];
      /** Log-scale x axis, for values like activation density. */
      xLog?: boolean;
      points: { x: number; y: number; highlight?: boolean }[];
      /** Optional horizontal threshold line with a label. */
      threshold?: { y: number; label: string };
    })
  | (FigureBase & {
      kind: 'timeline';
      steps: { date: string; title: string; detail: string }[];
    });

export type Post = {
  /** Must match the file name: `src/content/research/<slug>.ts`. */
  slug: string;
  title: string;
  /** ISO date, like `2026-10-28`. Newest posts appear first everywhere. */
  date: string;
  topic: Topic;
  authors: string[];
  /** Plain text, two to four sentences. Shown on Home, the index, and the post. */
  abstract: string;
  /**
   * The post body in Markdown: `## Heading`, paragraphs, `*italic*`,
   * `**bold**`, `` `code` ``, `[link](url)`, `> quote`, `- list`,
   * `[^sidenote-id]`, `[@citation-key]`, and `::figure[id]` lines.
   * Leave it out to show the abstract and "Full paper coming soon".
   */
  body?: string;
  sidenotes?: Sidenote[];
  figures?: FigureSpec[];
  citations?: Citation[];
  /** The header figure. Defaults to the contour field seeded by the slug. */
  screen?: Screen;
};
