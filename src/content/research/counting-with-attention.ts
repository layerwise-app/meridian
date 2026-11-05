import type { Post } from '../types';

export default {
  slug: 'counting-with-attention',
  title: 'Counting with attention: a toy model of tally circuits',
  date: '2026-09-02',
  topic: 'Interpretability',
  authors: ['Amara Okafor', 'Callum Reid'],
  abstract:
    'Small transformers trained to count occurrences of a token learn a recognisable circuit: one attention head spreads its weight evenly over every match, and a later layer reads the count from how diluted that attention is. We reverse-engineer the circuit in a two-layer model, show where it breaks as counts grow past about forty, and find a version of the same mechanism inside Meridian 3 that explains some of its counting errors in long documents.'
} satisfies Post;
