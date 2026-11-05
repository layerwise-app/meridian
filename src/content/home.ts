import type { ContactCopy, Screen } from './types';

/**
 * Copy for the home page, in the order it appears. Change a headline or a
 * number here; the components read it as is. Call-to-action labels live in
 * `src/site.config.ts`.
 */
export const home = {
  seo: {
    title: 'Meridian — an independent AI research lab',
    description:
      'Meridian studies honesty, interpretability, and long-context reasoning in language models. Meridian 3 is now available for research access.'
  },

  // 1. Statement
  statement: {
    kicker: 'Independent research lab · Edinburgh & Montréal',
    headline:
      'We build language models, and the instruments to tell when they are wrong.',
    body: 'Meridian is sixty people working on the parts of AI that are easiest to skip: whether a model is honest under pressure, what its internal features represent, and where it fails without saying so. We publish what we find, including the results that do not flatter us.',
    secondary: { label: 'Read the research', href: '/research' },
    screen: { kind: 'drawn', seed: 'home' } as Screen,
    figureLabel:
      'A field of fine contour lines that drifts slowly and bends away from the pointer.',
    caption:
      'The contour field. A slowly drifting surface traced into lines, one in oxblood; they lean away from your pointer.'
  },

  // 2. Meridian 3 (summary and table rows come from model-card.ts)
  model: {
    number: '§ 1',
    kicker: 'New model',
    title: 'Meridian 3',
    tableCaption: 'Selected results, out of 100. Select a column heading to sort.',
    modelCardLink: { label: 'Read the full model card', href: '/meridian-3' }
  },

  // 3. Latest research (the three newest posts)
  research: {
    number: '§ 2',
    title: 'Latest research',
    count: 3,
    allLink: { label: 'All research', href: '/research' }
  },

  // 4. How we work: each principle is a paragraph with a margin note.
  principles: {
    number: '§ 3',
    title: 'How we work',
    items: [
      {
        title: 'Measure before you claim.',
        body: 'Every result we publish comes with the evaluation that produced it, the code to rerun it, and the cases where it fails. If we cannot say how a number could be wrong, we do not report it.',
        sidenote:
          'This rules out some flattering numbers. In 2025 we withdrew a reasoning score after finding that 4% of its test items had leaked into a public web crawl.'
      },
      {
        title: 'Prefer the boring explanation.',
        body: 'When a model does something surprising, the first hypothesis is a bug in our pipeline, the second is a shortcut in the data, and only the third is a new capability. Most weeks, the first one is right.',
        sidenote:
          'We keep a shared log of surprising results and what they turned out to be. Of the last forty entries, twenty-six were pipeline bugs.'
      },
      {
        title: 'Publish the negative results.',
        body: 'An idea that did not work is still information, and keeping it private only means someone else spends six months finding out. We write up what failed with the same care as what succeeded.',
        sidenote:
          'Roughly a third of our technical reports describe approaches we have since abandoned, and say why.'
      },
      {
        title: 'Stay small enough to argue.',
        body: 'Sixty people can still read each other’s drafts. We grow slowly, keep teams of four to six, and expect anyone to question any result, including the director’s.',
        sidenote:
          'Every paper gets an internal reviewer from a different team, who has to sign off on the claims, not the prose.'
      }
    ]
  },

  // 5. Careers (roles come from careers.ts)
  careers: {
    number: '§ 4',
    title: 'Careers',
    intro:
      'We are hiring for five roles across Edinburgh and Montréal. Each one is a small team’s next colleague, not a headcount target.',
    allLink: { label: 'Roles and how to apply', href: '/careers' }
  },

  // 6. Research access: the sign-up form.
  access: {
    number: '§ 5',
    title: 'Request research access',
    intro:
      'Meridian 3 is available to researchers at universities, non-profits, and companies studying model behaviour. Tell us who you are and what you would like to do; we read every request and reply within ten working days.',
    fields: {
      name: { label: 'Name', autoComplete: 'name' },
      email: { label: 'Email', autoComplete: 'email', hint: 'We reply here.' },
      organization: {
        label: 'Organisation',
        autoComplete: 'organization',
        hint: 'Or “Independent”.'
      },
      intendedUse: {
        label: 'Intended use',
        hint: 'What would you study, and what would you need from us?',
        max: 500
      }
    },
    submit: 'Request research access',
    sending: 'Sending…',
    success: {
      title: 'Thank you. Your request is in.',
      body: 'We read every request and will reply to {email} within ten working days.'
    },
    duplicate: {
      title: 'You’re already on the list.',
      body: 'We have a request from {email}, so there is nothing more to do. We will reply there.'
    },
    rateLimited: {
      withEmail:
        'That is a lot of requests from one place in a short time. Please wait an hour and try again, or write to {contact}.',
      withoutEmail:
        'That is a lot of requests from one place in a short time. Please wait an hour and try again.'
    } as ContactCopy,
    failed:
      'We couldn’t send your request. Your answers are still here; check your connection and try again in a moment.',
    privacyNote:
      'We use these details only to review your request and reply. See the privacy notice.'
  }
};
