import type { Post } from '../types';

export default {
  slug: 'disclosure-norms-for-capability-evaluations',
  title: 'Disclosure norms for dangerous-capability evaluations',
  date: '2026-06-17',
  topic: 'Policy',
  authors: ['Gabriel Côté', 'Nadia Haddad'],
  abstract:
    'Labs increasingly publish results from evaluations of dangerous capabilities, but rarely enough detail to tell what a score of zero means. We propose a short disclosure standard covering who ran the evaluation, how much effort went into eliciting the capability, which results were withheld and why, and what would have changed the release decision. We apply it to our own evaluations of Meridian 3 as a worked example.'
} satisfies Post;
