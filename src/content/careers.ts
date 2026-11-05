import type { Screen } from './types';

/** Open roles, shown on Home (as a list) and on `/careers` (in full). */

export type Role = {
  /** Used for the anchor link, like `/careers#research-scientist-honesty`. */
  id: string;
  title: string;
  team: string;
  location: string;
  type: string;
  summary: string;
};

export const careers = {
  kicker: 'Careers',
  title: 'Work slowly on hard problems, with people who check each other’s work.',
  intro:
    'We are sixty people across two offices, and we hire a few at a time. Most of us split our weeks between running experiments and arguing about what they mean. We pay at the top of the Edinburgh and Montréal markets, publish under our own names, and do not ask anyone to work weekends to hit a release date.',
  applyEmail: 'careers@example.com',
  applyTitle: 'How to apply',
  applySteps: [
    'Email careers@example.com with the role’s title as the subject.',
    'Attach a CV, or a link to one. A list of things you have built or written is just as good.',
    'Write a few paragraphs about a piece of work you are proud of, including something about it that went wrong.'
  ],
  applyNote:
    'A person reads every application and replies within three weeks, whatever the answer. If you need adjustments to any part of the process, say so in your email.',

  roles: [
    {
      id: 'research-scientist-honesty',
      title: 'Research Scientist, Honesty and Calibration',
      team: 'Alignment',
      location: 'Edinburgh',
      type: 'Full-time',
      summary:
        'Design training objectives and evaluations for models that hold correct answers under pressure and abstain when they should. You will own part of the Steadfast and Lantern suites and the experiments that feed them.'
    },
    {
      id: 'research-engineer-interpretability',
      title: 'Research Engineer, Interpretability Tooling',
      team: 'Interpretability',
      location: 'Montréal',
      type: 'Full-time',
      summary:
        'Build the infrastructure that lets researchers train sparse dictionaries on billions of activations and browse what they find. Strong systems engineering matters more here than prior interpretability work.'
    },
    {
      id: 'evaluation-scientist-long-context',
      title: 'Evaluation Scientist, Long-Context Reasoning',
      team: 'Reasoning',
      location: 'Edinburgh or Montréal',
      type: 'Full-time',
      summary:
        'Write evaluations that catch quiet failures in long documents: answers that sound right and are not. You will extend LongTrace to messier, real-world archives and work out how to grade synthesis, not just retrieval.'
    },
    {
      id: 'policy-researcher-evaluation-standards',
      title: 'Policy Researcher, Evaluation Standards',
      team: 'Policy',
      location: 'Edinburgh, hybrid',
      type: 'Full-time',
      summary:
        'Help turn our evaluation practice into commitments others can audit, starting with held-out test sets and disclosure norms. You will write for regulators and researchers, and sometimes for both at once.'
    },
    {
      id: 'infrastructure-engineer-training',
      title: 'Infrastructure Engineer, Training Systems',
      team: 'Infrastructure',
      location: 'Montréal',
      type: 'Full-time',
      summary:
        'Keep our training runs reproducible: data lineage, shard hashing, checkpoint provenance, and the tooling behind our commitment not to train on Commons-Held. Experience with large distributed jobs is expected.'
    }
  ] satisfies Role[],

  screen: { kind: 'drawn', seed: 'careers' } as Screen,
  figureCaption: 'Contour field, seeded “careers”.'
};
