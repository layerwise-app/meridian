import { siteConfig } from '~/site.config';

const { colors, fonts } = siteConfig;

/** `@font-face` rules and colour variables, written into every page's head. */
export const themeCss = [
  `@font-face{font-family:'${fonts.serif.family}';font-style:normal;font-weight:${fonts.serif.weights};font-display:swap;src:url(${fonts.serif.normal}) format('woff2');}`,
  `@font-face{font-family:'${fonts.serif.family}';font-style:italic;font-weight:${fonts.serif.weights};font-display:swap;src:url(${fonts.serif.italic}) format('woff2');}`,
  // A metric-matched local fallback, so text doesn't reflow when the web font arrives.
  `@font-face{font-family:'${fonts.serif.family} Fallback';src:local('${fonts.serif.fallback.local}');size-adjust:${fonts.serif.fallback.sizeAdjust};ascent-override:${fonts.serif.fallback.ascentOverride};descent-override:${fonts.serif.fallback.descentOverride};line-gap-override:0%;}`,
  ...fonts.mono.files.map(
    (file) =>
      `@font-face{font-family:'${fonts.mono.family}';font-style:normal;font-weight:${file.weight};font-display:swap;src:url(${file.src}) format('woff2');}`
  ),
  `:root{--paper:${colors.paper};--paper-deep:${colors.paperDeep};--ink:${colors.ink};--ink-soft:${colors.inkSoft};--rule:${colors.rule};--accent:${colors.accent};--accent-wash:${colors.accentWash};` +
    `--font-serif-stack:'${fonts.serif.family}','${fonts.serif.family} Fallback',Georgia,'Times New Roman',serif;` +
    `--font-mono-stack:'${fonts.mono.family}',ui-monospace,'SFMono-Regular',Menlo,monospace;}`
].join('\n');

/** Fonts worth fetching before the stylesheet asks for them. */
export const fontPreloads = [
  fonts.serif.normal,
  ...fonts.mono.files.slice(0, 1).map((file) => file.src)
];
