import type { Post } from '../types';

export default {
  slug: 'a-public-test-set-we-promise-not-to-train-on',
  title: 'A public test set we promise not to train on',
  date: '2026-10-28',
  topic: 'Policy',
  authors: ['Nadia Haddad', 'Gabriel Côté', 'Sorcha Lennox'],
  abstract:
    'Benchmark contamination makes every public number a little less true. We are releasing Commons-Held, a 3,400-item reasoning test set, with a commitment: we will not train on it, we will publish a hash of every training data shard so others can check, and we will retire the set publicly if we find it has leaked. This post explains the mechanics, the ways the promise could still fail, and why we think a promise you can audit is worth more than a benchmark you cannot.',
  body: `
Every widely used benchmark eventually ends up in someone's training data. Usually nobody intends it. Test items get quoted in papers, discussed on forums, copied into tutorials, and scraped back into the web crawls that models learn from. After a year or two, a high score on a public benchmark means some mixture of "the model can do this" and "the model has seen this", and nobody outside the lab can tell the proportions.

## The problem with public numbers

The usual responses each give something up. Private test sets avoid contamination but ask everyone to trust the lab that holds them. Contamination checks after the fact help [@abara2025], but they can only find what they look for, and they are run by the people with the most to lose from a positive result. Retiring benchmarks frequently keeps them fresh but makes progress hard to track over time.

We want a test set that is public, so anyone can run it, and whose cleanliness can be checked by people who do not work here. That turns out to require less novel technology than we expected, and more commitment.

## What we are releasing

Commons-Held is 3,400 newly written reasoning questions across science, law, history, and everyday logic, written between January and April 2026 by 31 annotators who were paid for their time and credited by name in the release. None of the items existed anywhere before the annotators wrote them.

With the questions, we are publishing three things that make the promise checkable.

The first is a canary string: a random sentence embedded in every file of the set, with a request that anyone who trains models exclude documents containing it.[^canary] Canary strings are an established convention for evaluation data [@ferreira2023], and they work as a filter for anyone who honours them.

The second is a hash commitment. Before releasing anything, we computed a cryptographic hash of every item and published the list. If an item later turns up somewhere, anyone can prove it came from the set, and that it was not changed after the fact.[^hash]

The third is the part that binds us. For every model we train from now on, we will publish hashes of every training data shard alongside the model card. Anyone holding Commons-Held can then check, without seeing our data, whether a shard contains any of its items.

::figure[commitment-timeline]

## How you can check us

The check is deliberately simple: normalise the text of each Commons-Held item, compute its n-gram fingerprints, and compare them against fingerprints we publish for each shard. It needs no access to our systems and runs on a laptop. We have published the code, and we would rather it be run by people who are sceptical of us.

We also ran the check ourselves on Meridian 3's training data before release. Figure 2 shows the result. Exact and 13-gram matching found no overlaps. An embedding-based paraphrase search flagged 41 documents, and on manual review two of them were genuine: a forum post paraphrasing an item that one annotator had discussed with a friend. We replaced both items before release and recorded the replacement in the changelog.

::figure[audit-results]

## How this could still go wrong

A promise is only as good as the ways it can fail, so here are the ones we can see.

Paraphrase is the weak point. Hashes and n-grams catch copies; they do not catch a forum post that explains an item in different words, which is exactly what we found. Our embedding search catches some of these, but not all, and the threshold is a judgement call.

We could also be wrong about our own data. Shard hashes prove what was in a shard; they do not prove that every shard we trained on is in the published list. An outside audit is the only real answer to that, and we have committed to one each year.[^audit]

Finally, other labs have made no such promise, and their models may well have seen Commons-Held by this time next year. The set will stay clean as a measure of our models for longer than it stays clean as a measure of anyone else's.

## Why a promise

None of the parts here is new. What is different is putting them together as a public commitment with a public way to fail, including the commitment to retire the set and say so if it leaks.[^retire] Credible commitments are worth more when they are costly to break [@osei2026], and the cost here is our reputation for honest numbers, which is most of what a small lab has.

The held-out set, the hash list, the audit code, and the shard hashes for Meridian 3 are all in the release.
`,
  sidenotes: [
    {
      id: 'canary',
      text: 'If a model can complete the canary string from its first few words, the set was almost certainly in its training data.'
    },
    {
      id: 'hash',
      text: 'Hashes are of normalised text (Unicode NFC, lower case, collapsed whitespace), so trivial reformatting cannot disguise an item.'
    },
    {
      id: 'audit',
      text: 'The first audit is being arranged with an independent academic group, which we will name once the agreement is signed.'
    },
    {
      id: 'retire',
      text: 'Retiring a test set is cheap for us and expensive for everyone who has reported results on it, which is exactly why the commitment should be public.'
    }
  ],
  figures: [
    {
      id: 'commitment-timeline',
      kind: 'timeline',
      caption:
        'How the commitment is built. The hash list is published before the items, so the items cannot be quietly changed later.',
      steps: [
        {
          date: 'Jan–Apr 2026',
          title: 'Items written',
          detail: '3,400 questions by 31 credited annotators'
        },
        {
          date: 'May 2026',
          title: 'Hashes published',
          detail: 'One hash per item, before any release'
        },
        {
          date: 'Sep 2026',
          title: 'Shards checked',
          detail: 'Meridian 3 training data audited; 2 items replaced'
        },
        {
          date: 'Oct 2026',
          title: 'Public release',
          detail: 'Items, canary string, and shard hashes'
        },
        {
          date: 'Each year',
          title: 'Outside audit',
          detail: 'An independent group reruns the checks'
        }
      ]
    },
    {
      id: 'audit-results',
      kind: 'bars',
      caption:
        'Pre-release contamination check on Meridian 3’s training data, by method. Paraphrase search flags many near-misses; manual review confirmed two.',
      yLabel: 'Documents',
      categories: ['Exact match', '13-gram', 'Paraphrase', 'Canary'],
      yDomain: [0, 50],
      series: [
        { name: 'Flagged', values: [0, 0, 41, 0] },
        { name: 'Confirmed on review', values: [0, 0, 2, 0], accent: true }
      ]
    }
  ],
  citations: [
    {
      key: 'abara2025',
      authors: 'Y. Abara and T. Kowalczyk',
      title: 'Measuring benchmark contamination after the fact',
      venue: 'Transactions on Machine Learning Methods, 3',
      year: 2025
    },
    {
      key: 'ferreira2023',
      authors: 'L. Ferreira',
      title: 'Canary strings for evaluation data provenance',
      venue: 'Workshop on Data Provenance and Documentation',
      year: 2023
    },
    {
      key: 'osei2026',
      authors: 'M. Osei and R. Halloran',
      title: 'Credible commitments in AI development',
      venue: 'Journal of Technology Policy, 9(1)',
      year: 2026
    }
  ]
} satisfies Post;
