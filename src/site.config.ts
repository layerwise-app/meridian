/**
 * Site-wide settings: names, navigation, call-to-action labels, links,
 * colours, fonts, and the owner's email address. Page copy lives in
 * `src/content/`.
 *
 * Keep this file free of imports: the share-image script reads it directly.
 */
export const siteConfig = {
  company: 'Meridian',
  /** Used in the footer, terms, and structured data. */
  legalName: 'Meridian Research Ltd',
  product: 'Meridian 3',
  tagline: 'An independent research lab in Edinburgh and Montréal.',
  description:
    'Meridian is an independent AI research lab of sixty people in Edinburgh and Montréal, studying honesty, interpretability, and long-context reasoning in language models.',
  locations: ['Edinburgh', 'Montréal'],
  founded: 2022,

  nav: [
    { label: 'Research', href: '/research' },
    { label: 'Meridian 3', href: '/meridian-3' },
    { label: 'Careers', href: '/careers' }
  ],

  /** Every button that asks a visitor to act leads to the form at `/#access`. */
  cta: {
    label: 'Request research access',
    shortLabel: 'Request access',
    href: '/#access'
  },

  /**
   * Shown in the footer. Entries with an empty `href` are hidden, so fill in
   * the ones you use.
   */
  social: [
    { label: 'Email', href: 'mailto:hello@example.com' },
    { label: 'GitHub', href: '' },
    { label: 'Bluesky', href: '' },
    { label: 'LinkedIn', href: '' }
  ],

  /**
   * Colours. Body text must keep at least 4.5:1 contrast against `paper`;
   * `inkSoft` and `accent` are used for text too.
   */
  colors: {
    paper: '#F5F1E8',
    paperDeep: '#ECE6D8',
    ink: '#1C1A17',
    inkSoft: '#57514A',
    rule: '#D5CCBA',
    accent: '#7A2B22',
    accentWash: '#EFDFD6'
  },

  /**
   * Fonts, self-hosted from `public/fonts/`. `fallback` metrics keep the
   * layout steady while the web font loads; recompute them if you change the
   * serif (see README).
   */
  fonts: {
    serif: {
      family: 'Newsreader',
      weights: '400 500',
      normal: '/fonts/newsreader-latin-opsz-normal.woff2',
      italic: '/fonts/newsreader-latin-opsz-italic.woff2',
      fallback: {
        local: 'Georgia',
        sizeAdjust: '96.6%',
        ascentOverride: '76.08%',
        descentOverride: '27.43%'
      }
    },
    mono: {
      family: 'IBM Plex Mono',
      files: [
        { weight: 400, src: '/fonts/ibm-plex-mono-latin-400-normal.woff2' },
        { weight: 500, src: '/fonts/ibm-plex-mono-latin-500-normal.woff2' }
      ]
    }
  },

  /**
   * Where new research-access requests are emailed (at most 100 a day). Leave
   * empty to only save them; they always appear in Layerwise's Database panel
   * under `access_requests`.
   */
  ownerEmail: ''
};

export type SiteConfig = typeof siteConfig;
