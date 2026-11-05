import type { Screen } from './types';

/** Copy for the research index, the legal pages, and the 404 page. */

export const researchIndex = {
  seo: {
    title: 'Research — Meridian',
    description:
      'Papers and notes from Meridian on alignment, interpretability, reasoning, and policy, with sidenotes, figures, and full references.'
  },
  kicker: 'Research',
  title: 'Research index',
  intro:
    'Everything we have published, newest first. Filter by topic, or type to search titles, authors, and abstracts.',
  filterLabel: 'Filter posts',
  filterPlaceholder: 'Search titles, authors, abstracts',
  empty: 'No posts match. Clear the filters to see everything.',
  screen: { kind: 'drawn', seed: 'research' } as Screen,
  figureLabel: 'A band of fine contour lines, drifting slowly.',
  caption: 'Contour field, seeded “research”.'
};

export const comingSoon = 'Full paper coming soon';

type LegalSection = { heading: string; body: string[] };

export const privacyPage = {
  seo: {
    title: 'Privacy — Meridian',
    description:
      'How Meridian handles the details you send through its research access form, and what it never collects.'
  },
  kicker: 'Privacy',
  title: 'Privacy notice',
  updated: '2026-10-28',
  intro:
    'This notice covers this website. It is short because we collect very little.',
  sections: [
    {
      heading: 'What we collect',
      body: [
        'When you request research access, we store the name, email address, organisation, and intended use you type into the form, and the time you sent it.',
        'To stop automated abuse, we also store a one-way, salted hash of your IP address for up to a day. We never store the address itself, and the hash cannot be used to find it.'
      ]
    },
    {
      heading: 'What we do not collect',
      body: [
        'This site sets no advertising or tracking cookies and runs no third-party analytics. We do not buy, sell, or share personal data.'
      ]
    },
    {
      heading: 'How we use it',
      body: [
        'We use your request only to review it and reply to you. A small team at Meridian can read it. We do not add you to a mailing list.'
      ]
    },
    {
      heading: 'How long we keep it',
      body: [
        'We keep access requests for two years after our last reply, then delete them. You can ask us to delete yours sooner at any time.'
      ]
    },
    {
      heading: 'Your rights',
      body: [
        'You can ask for a copy of what we hold about you, ask us to correct it, or ask us to delete it, by writing to privacy@example.com. If you are unhappy with our answer, you can complain to your local data protection authority.'
      ]
    }
  ] satisfies LegalSection[],
  screen: { kind: 'drawn', seed: 'privacy' } as Screen
};

export const termsPage = {
  seo: {
    title: 'Terms — Meridian',
    description:
      'The terms for using Meridian’s website and the research it publishes.'
  },
  kicker: 'Terms',
  title: 'Terms of use',
  updated: '2026-10-28',
  intro:
    'These terms cover this website. Access to Meridian 3 is governed by a separate research licence, sent with every approval.',
  sections: [
    {
      heading: 'Using this site',
      body: [
        'You may read, link to, and share anything here. Please do not try to disrupt the site, overload it, or submit requests on someone else’s behalf without their permission.'
      ]
    },
    {
      heading: 'Our research',
      body: [
        'Unless a post says otherwise, the text and figures we publish are licensed under Creative Commons Attribution 4.0. Cite the post and its authors when you reuse them.'
      ]
    },
    {
      heading: 'No warranty',
      body: [
        'We publish carefully, but research is provisional. The site and its contents are provided as they are, without warranties, and we are not liable for decisions made on the basis of them.'
      ]
    },
    {
      heading: 'Changes and contact',
      body: [
        'If we change these terms, we will update the date at the top. Questions go to hello@example.com.'
      ]
    }
  ] satisfies LegalSection[],
  screen: { kind: 'drawn', seed: 'terms' } as Screen
};

export const notFoundPage = {
  kicker: 'Error 404',
  title: 'This page is not in the archive.',
  body: 'The address may be mistyped, or the page may have moved. Everything we have published is listed in the research index.',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Research index', href: '/research' }
  ],
  screen: { kind: 'drawn', seed: 'not-found' } as Screen,
  figureLabel: 'A band of contour lines with no particular destination.',
  caption: 'Contour field, seeded “not-found”. It doesn’t lead anywhere either.'
};
