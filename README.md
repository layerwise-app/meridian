<a href="https://layerwise.app"><img src="https://layerwise.app/powered-by.png" alt="Powered by Layerwise" width="174" height="28" /></a>

# Meridian

A landing page template for an AI research lab, set like a quarterly journal:
the lab's home page, its research index, a page per paper, and the model card
for its new model. The sample lab, Meridian, and everyone in it are fictional.

Pages: Home (`/`), Research (`/research`), one page per post
(`/research/<slug>`), Meridian 3 (`/meridian-3`), Careers (`/careers`),
Privacy, Terms, and a 404 page. There are no accounts or sign-in.

Built with TanStack Start, React, Tailwind CSS, and Layerwise's database and
email, on Cloudflare Workers.

## Rewrite the copy

Every word on the site lives in a few typed files. Change them and the pages
follow.

| What | Where |
| --- | --- |
| Company name, tagline, navigation, button labels, social links, colours, fonts, `ownerEmail` | `src/site.config.ts` |
| Home, section by section in page order | `src/content/home.ts` |
| Meridian 3 model card and evaluation table | `src/content/model-card.ts` |
| Open roles and how to apply | `src/content/careers.ts` |
| Research index, Privacy, Terms, 404 | `src/content/pages.ts` |
| Research posts, one file each | `src/content/research/<slug>.ts` |

Every "Request research access" button goes to the form at `/#access`; change
the label once in `siteConfig.cta`.

After changing a title, seed, colour, or font, run `pnpm share-images` to
redraw the share images and figure stills.

## Add a research post

1. Copy a file in `src/content/research/`, say
   `measuring-honesty-under-pressure.ts`, to `src/content/research/<slug>.ts`.
   The `slug` field must match the file name.
2. Fill in `title`, `date` (ISO, like `2026-11-20`), `topic` (Alignment,
   Interpretability, Reasoning, or Policy), `authors`, and `abstract`.
3. Write the `body` in Markdown, or leave it out to publish the abstract with
   "Full paper coming soon".
4. Run `pnpm share-images` to make its share image and figure still.

The post then appears on Home (if it is among the three newest), in the
research index, and in `/sitemap.xml`. Its header figure is the contour field
seeded by its slug.

Post Markdown supports `## Headings` (which build the table of contents),
paragraphs, `*italic*`, `**bold**`, `` `code` ``, `[links](https://…)`, `> quotes`,
and `- lists`, plus:

- `[^id]` places a sidenote from the post's `sidenotes` list. Sidenotes sit
  in the margin on wide screens and become numbered footnotes on phones.
- `[@key]` (or `[@a; @b]`) cites entries from `citations`. Each opens a
  popover with the full reference and is listed under References.
- `::figure[id]` on its own line places a figure from `figures`, numbered in
  order. Kinds: `line`, `bars`, `scatter`, and `timeline`, drawn in SVG from
  the numbers you give.

## Replace a drawn figure with a screenshot or video

Each page's figure sits in one slot (`ScreenSlot`), set by a `screen` value:
`statement.screen` in `home.ts`, `screen` in `model-card.ts`, `careers.ts`, and
`pages.ts`, or an optional `screen` on a post.

For an image:

```bash
pnpm add-images path/to/lab-photo.jpg --name lab-photo
```

This writes 800, 1600, and 2880 px WebP files to `public/images/` (never
enlarging), and records the dimensions and a tiny blurred placeholder in
`src/content/images.json`. GIFs are copied unchanged; SVGs are refused. Then
set the slot:

```ts
screen: { kind: 'image', image: 'lab-photo', alt: 'The Edinburgh office at dusk' }
```

Then rewrite the caption beside it, which still describes the contour
field: `statement.caption` in `home.ts`, `figureCaption` in `model-card.ts`
and `careers.ts`, or `caption` in `pages.ts`. A post's caption follows its
slot on its own.

For a video, put the file in `public/media/` and set
`{ kind: 'video', src: '/media/demo.mp4', poster: '/media/demo.jpg', alt: '…' }`.
Videos play muted while on screen, never on their own under reduced motion,
and have a pause button.

To go back, set `{ kind: 'drawn', seed: 'home' }`. Any seed string gives its
own deterministic field.

## Change fonts and colours

Colours are in `siteConfig.colors`. Keep body text (`ink`, `inkSoft`, and
`accent`) at 4.5:1 contrast or more against `paper`.

Fonts are self-hosted from `public/fonts/` and declared in `siteConfig.fonts`.
To change the serif, add its `.woff2` files to `public/fonts/`, update the
family and file paths, and update `fallback` (the size and ascent overrides
that stop text reflowing while the font loads). Share images are drawn from
the `.woff` files in `scripts/fonts/`, so replace those too and run
`pnpm share-images --force`.

The included Newsreader files are cut down to Latin characters and weights
400 to 500, the ones the site uses; add the full files from the font's
release if you need more.

Included fonts, both under the SIL Open Font License 1.1 (license texts in
`public/fonts/`):

- [Newsreader](https://github.com/productiontype/Newsreader) by Production
  Type, for display and text.
- [IBM Plex Mono](https://github.com/IBM/plex) by IBM, for data and labels.

## Research access form and `ownerEmail`

Submissions are saved to the project database. Open the project's
**Database** panel in Layerwise and look at the `access_requests` table.

- The server validates every field, ignores submissions that fill the hidden
  honeypot field, and allows five submissions per visitor per hour. Visitors
  are identified by a salted SHA-256 hash of their IP address, kept for a day;
  the address itself is never stored. Set an `IP_HASH_SALT` secret to choose the
  salt; otherwise one is generated and kept in the `site_secrets` table.
- The same email twice shows "You're already on the list" and adds no row.
- To be emailed about each new request, set `ownerEmail` in
  `src/site.config.ts`. At most 100 notifications are sent a day; past that,
  requests are still saved. The form never emails the visitor. In the local
  preview, notifications appear under Email → Local instead of being sent.

The rules are in `src/lib/access/rules.ts`, with tests in `tests/`.

## Commands

```bash
pnpm dev             # Layerwise runs this for you
pnpm check-types
pnpm lint
pnpm test
pnpm build
pnpm preview         # the production build, compressed like Cloudflare serves it
pnpm share-images    # share images (public/og) and figure stills (public/figures)
pnpm add-images <file or folder> [--name <name>]
pnpm icons           # logo.png and every favicon, redrawn from public/logo.svg
pnpm db:generate --name <migration_name>
pnpm db:migrate
```

## Credits

No maps or geographic outlines are used; the logo's globe is a plain circle.
If you add map or globe outlines, take them from
[Natural Earth](https://www.naturalearthdata.com/) (public domain) and credit
them here.
