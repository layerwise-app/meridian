import type { Post } from '../types';

export default {
  slug: 'why-long-context-fails-quietly',
  title: 'Why long context fails quietly',
  date: '2026-10-14',
  topic: 'Reasoning',
  authors: ['Rohan Desai', 'Juliette Bouchard', 'Ewan Fraser'],
  abstract:
    'Models with very long context windows rarely fail loudly. They answer fluently, cite plausible passages, and are wrong more often than their confidence suggests once the evidence sits deep in a long document. We trace three mechanisms behind these quiet failures in Meridian 2: positional dilution, distractor capture, and premature commitment. We then describe the changes that reduced them in Meridian 3, and the confidence signal that still does not track accuracy as well as it should.',
  body: `
When a model with a short context window cannot see the evidence, it usually knows. The document has been truncated, the question refers to something absent, and a reasonable model says so. Long context removes that signal. Everything is technically in view, so the model never has a reason to say it cannot find something, even when, in any practical sense, it has not.

## The failure that doesn't look like one

The failures we care about here have a specific shape. The answer is fluent. It often quotes a passage from the document, and the passage is real. The model's stated confidence is no lower than usual. And the answer is wrong, because the quoted passage is not the one that settles the question.[^quiet]

These are hard to catch in practice, because every surface feature a reader might use to decide whether to double-check looks normal. They are also hard to catch in evaluation, because most long-context benchmarks score only the final answer, not whether the model's confidence moved with its accuracy.

## Three mechanisms

We studied 4,200 failures of Meridian 2 on LongTrace [@desai2025], a multi-hop benchmark where the evidence for each question is placed at a controlled depth in documents of up to 256K tokens. Reading transcripts and attention patterns together, we sorted most of them into three groups.

*Positional dilution.* Evidence in the middle of a long document is used less reliably than evidence near the start or end. This pattern has been reported for many architectures [@varga2024], and Meridian 2 showed it strongly.[^ushape]

*Distractor capture.* Long documents contain passages that resemble the evidence: same entities, same vocabulary, different facts. The model latches onto one of them, often because it appears earlier.[^distractor]

*Premature commitment.* The model settles on a candidate answer early in its reasoning and then stops reading later context with any care. In the attention patterns this looks like a sharp drop in reads of the remaining document once a first candidate has been written down.

::figure[accuracy-by-depth]

## Measuring at depth

Figure 1 shows accuracy as a function of where the decisive evidence sits, for documents of 256K tokens. Meridian 2's curve has the familiar dip: from 79% when the evidence is near the start, to 27% at around 70% depth, recovering to 47% at the very end. Those middle questions are the quiet failures. Meridian 2 answered them with almost exactly the same confidence it reported on questions it got right.

## What we changed for Meridian 3

Three changes account for most of the improvement, and each targets one mechanism.

For dilution, we trained on long documents whose answers depend on evidence uniformly spread across depth, rather than the naturally front-loaded documents that dominate web text. This flattened the curve more than any architectural change we tried.

For distractor capture, we built training examples with deliberate near-miss passages and rewarded answers that cited the right one. This also improved citation accuracy on unrelated tasks, which we did not expect.

For premature commitment, we rewarded the model for checking at least one later passage before finalising an answer whenever the question involved more than one hop. This is crude, and it costs about 6% more tokens per answer, but it works.

Meridian 3's curve in Figure 1 still dips, from 88% to 72%, but the dip is far shallower and the recovery nearly complete. On LongTrace overall it scores 78.4, against 41.9 for Meridian 2.

## The part we haven't fixed

::figure[confidence-gap]

Accuracy improved. Calibration improved less. Figure 2 shows Meridian 3's accuracy and its average stated confidence as the context grows. Up to 32K tokens they agree within three points. At 256K the model is about ten points more confident than it is accurate.

This matters more than the raw accuracy, because it is the gap that makes failures quiet. A model that is wrong 21% of the time at depth and says so is useful; one that is wrong 21% of the time and sounds certain is a hazard. Verbalised confidence is known to be a weak signal in general [@sato2026], and our results suggest it gets weaker exactly where it is most needed.

We are working on two things. The first is training the abstention objective on long documents specifically, where it was underrepresented. The second is a cheaper signal: whether the model's answer changes when the document is reordered. Early results suggest that disagreement under reordering predicts errors at depth better than anything the model says about itself. We will report on both when we have numbers we trust.
`,
  sidenotes: [
    {
      id: 'quiet',
      text: 'We call a failure *quiet* when the answer is wrong but its stated confidence is within five points of the model’s average on questions it gets right.'
    },
    {
      id: 'ushape',
      text: 'The U shape (good at the start, worse in the middle, recovering at the end) is well documented. What surprised us was how flat Meridian 2’s confidence stayed across it.'
    },
    {
      id: 'distractor',
      text: 'LongTrace’s distractors share entities and vocabulary with the true evidence and contradict it on exactly the detail the question asks about.'
    }
  ],
  figures: [
    {
      id: 'accuracy-by-depth',
      kind: 'line',
      caption:
        'LongTrace accuracy by the depth of the decisive evidence, in 256K-token documents. Each point averages about 380 questions.',
      xLabel: 'Depth of evidence in the document',
      yLabel: 'Accuracy',
      x: ['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'],
      yDomain: [20, 100],
      yUnit: '%',
      series: [
        { name: 'Meridian 2', values: [79, 72, 61, 49, 40, 33, 29, 27, 30, 36, 47] },
        {
          name: 'Meridian 3',
          values: [88, 86, 84, 81, 78, 75, 73, 72, 74, 78, 84],
          accent: true
        }
      ]
    },
    {
      id: 'confidence-gap',
      kind: 'line',
      caption:
        'Meridian 3’s accuracy and mean stated confidence on LongTrace questions, by context length. The gap between them is where quiet failures live.',
      xLabel: 'Context length (tokens)',
      yLabel: 'Percent',
      x: ['8K', '16K', '32K', '64K', '128K', '256K'],
      yDomain: [70, 100],
      yUnit: '%',
      series: [
        { name: 'Stated confidence', values: [94, 94, 93, 92, 91, 89] },
        { name: 'Accuracy', values: [94, 93, 91, 88, 84, 79], accent: true }
      ]
    }
  ],
  citations: [
    {
      key: 'desai2025',
      authors: 'R. Desai and J. Bouchard',
      title: 'LongTrace: multi-hop evaluation at controlled depth',
      venue: 'Meridian Technical Report MR-2025-11',
      year: 2025
    },
    {
      key: 'varga2024',
      authors: 'H. Varga and D. Mensah',
      title: 'Positional effects in long-context retrieval',
      venue: 'Findings of the Workshop on Language Modelling',
      year: 2024
    },
    {
      key: 'sato2026',
      authors: 'E. Sato and M. Lindqvist',
      title: 'Verbalised confidence and its discontents',
      venue: 'Proceedings of the Conference on Evaluation Methods',
      year: 2026
    }
  ]
} satisfies Post;
