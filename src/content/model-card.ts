import type { Screen } from './types';

/**
 * The Meridian 3 model card. Home shows `summary` and the first four rows of
 * `evaluations`; `/meridian-3` shows everything.
 */

export type ModelColumn = {
  key: 'm3' | 'm2' | 'baselineA' | 'baselineB';
  label: string;
  /** Our own models get the accent colour. */
  ours: boolean;
};

export type Evaluation = {
  id: string;
  name: string;
  /** What the score is, like "accuracy" or "abstention F1". */
  metric: string;
  /** Scores out of 100; `null` where a model can't take the test. */
  scores: Record<ModelColumn['key'], number | null>;
  /** Footnote: what it measures. */
  measures: string;
  /** Footnote: where it falls short. */
  weaknesses: string;
};

export const modelCard = {
  name: 'Meridian 3',
  version: 'meridian-3-2026-10',
  released: '2026-10-28',
  kicker: 'Model card',
  title: 'Meridian 3',
  standfirst:
    'A language model that reads text and images, holds 256K tokens in view, and is trained to say when it does not know. This card describes what it is for, where it fails, and how we measured both.',

  /** Three sentences for Home. */
  summary: [
    'Meridian 3 reads text and images across a 256K-token context, and it is the first model we have trained with calibrated abstention as an explicit objective.',
    'On our long-context and honesty evaluations it improves on Meridian 2 by wide margins; on formal mathematics and multi-step agentic work it still trails the strongest frontier systems, and the table says so.',
    'It is available to researchers by application, with the full model card, our evaluation code, and the held-out test set we committed not to train on.'
  ],

  facts: [
    { label: 'Context length', value: '262,144 tokens (256K)' },
    { label: 'Modalities', value: 'Text and images in; text out' },
    { label: 'Training cutoff', value: 'March 2026' },
    { label: 'Released', value: '28 October 2026' },
    { label: 'Architecture', value: 'Dense decoder-only transformer; size not disclosed' },
    { label: 'Access', value: 'Research access by application' }
  ],

  intendedUses: [
    'Research on honesty, calibration, and abstention in language models, including red-teaming our own claims.',
    'Interpretability work that needs a capable model with published evaluation code and known training data boundaries.',
    'Reading and cross-referencing long documents: case files, codebases, regulatory filings, and collections of papers.',
    'Question answering over charts, tables, and scientific figures, where the model should say when a figure is ambiguous.',
    'Drafting and checking technical writing, with a person responsible for the final text.'
  ],

  limitations: [
    'Calibration degrades with length. At 256K tokens its stated confidence runs about ten points above its accuracy; below 32K the two agree within three.',
    'It still folds under fabricated evidence. When a user presents a convincing but false citation, it abandons a correct answer about a quarter of the time.',
    'Formal mathematics and long agentic tasks remain weak relative to the strongest frontier systems (see Proofline and Fieldwork below).',
    'Image understanding is limited to static images. It does not read video, and small text in dense charts below roughly 9 px is often misread.',
    'Its knowledge stops in March 2026, and it does not browse. It will sometimes state outdated facts with confidence it has not earned.',
    'It was evaluated mainly in English and French. Performance in other languages is lower and less well measured.'
  ],

  outOfScope: [
    'Decisions about people, such as hiring, lending, medical triage, or legal outcomes, without a qualified person reviewing every case.',
    'Generating content intended to deceive, including fabricated citations or impersonation.',
    'Any use that our research licence excludes; the full list is sent with access approval.'
  ],

  columns: [
    { key: 'm3', label: 'Meridian 3', ours: true },
    { key: 'm2', label: 'Meridian 2', ours: false },
    { key: 'baselineA', label: 'Frontier baseline A', ours: false },
    { key: 'baselineB', label: 'Frontier baseline B', ours: false }
  ] satisfies ModelColumn[],

  evaluationNote:
    'All scores are out of 100, higher is better, from our own runs in September 2026 with identical prompts and no per-model tuning. The two frontier baselines are widely used commercial models, evaluated through their public interfaces; we leave them unnamed because their versions change without notice. Each benchmark has a footnote on what it measures and where it falls short.',

  evaluations: [
    {
      id: 'longtrace',
      name: 'LongTrace 256K',
      metric: 'Accuracy',
      scores: { m3: 78.4, m2: 41.9, baselineA: 72.6, baselineB: 66.1 },
      measures:
        'Multi-hop questions whose evidence is scattered across documents of 128K to 256K tokens, with the relevant passages placed at controlled depths.',
      weaknesses:
        'The documents are synthetic compilations, cleaner than real archives. Questions have single short answers, so it rewards retrieval more than synthesis.'
    },
    {
      id: 'steadfast',
      name: 'Steadfast',
      metric: 'Answers held',
      scores: { m3: 88.1, m2: 63.7, baselineA: 74.9, baselineB: 70.2 },
      measures:
        'Whether a model keeps a correct answer through five turns of conversational pressure: repetition, appeals to authority, emotional appeals, partial concessions, and fabricated evidence.',
      weaknesses:
        'Pressure is scripted from 212 templates, so it misses the improvisation of a real, persistent user. Graded by model judges with human adjudication on disagreements.'
    },
    {
      id: 'lantern',
      name: 'Lantern',
      metric: 'Abstention F1',
      scores: { m3: 81.6, m2: 52.3, baselineA: 64.0, baselineB: 59.8 },
      measures:
        'Calibrated abstention: a mix of answerable questions and questions with no knowable answer, scored on declining exactly the ones it should.',
      weaknesses:
        'We trained Meridian 3 with abstention as an objective, so this favours it by design. “Unanswerable” is decided by annotators, who disagree on about 6% of items.'
    },
    {
      id: 'commons-held',
      name: 'Commons-Held',
      metric: 'Accuracy',
      scores: { m3: 71.8, m2: 58.4, baselineA: 76.2, baselineB: 69.5 },
      measures:
        'General reasoning on 3,400 newly written questions across science, law, history, and everyday logic. Public, and committed never to be used in our training.',
      weaknesses:
        'Written by 31 annotators, mostly in Scotland and Québec, so its idea of “everyday” knowledge is regional. Multiple-choice items allow some guessing.'
    },
    {
      id: 'atlas-charts',
      name: 'Atlas Charts',
      metric: 'Accuracy',
      scores: { m3: 74.3, m2: null, baselineA: 77.8, baselineB: 71.0 },
      measures:
        'Questions about charts, tables, and figures taken from scientific papers and public reports, where answers need reading values, axes, and legends.',
      weaknesses:
        'Meridian 2 could not read images, so it has no score. Figures come from English-language sources and overrepresent bar and line charts.'
    },
    {
      id: 'ledger',
      name: 'Ledger',
      metric: 'Exact match',
      scores: { m3: 83.0, m2: 71.2, baselineA: 85.4, baselineB: 80.1 },
      measures:
        'Numerical reasoning over tables: sums, rates, and comparisons across rows from financial statements and survey data.',
      weaknesses:
        'Exact-match scoring penalises correct answers with different rounding. Tables are small enough to fit in a short context, so it says nothing about scale.'
    },
    {
      id: 'proofline',
      name: 'Proofline',
      metric: 'Proofs verified',
      scores: { m3: 38.6, m2: 21.0, baselineA: 52.7, baselineB: 41.3 },
      measures:
        'Competition-level and textbook theorems the model must prove in a formal language, counted only when a proof checker accepts the proof.',
      weaknesses:
        'Some statements have public formal proofs that may appear in any model’s training data, including baselines we cannot inspect. Undergraduate algebra and number theory dominate.'
    },
    {
      id: 'fieldwork',
      name: 'Fieldwork',
      metric: 'Tasks completed',
      scores: { m3: 44.2, m2: 27.5, baselineA: 58.9, baselineB: 47.0 },
      measures:
        'Multi-step research tasks in a sandbox with a shell, a document store, and a calculator, such as reproducing a table from raw files.',
      weaknesses:
        'Only 140 tasks, so a difference of three points is within noise. Success is binary, which hides partial progress, and the sandbox is far tidier than real work.'
    }
  ] satisfies Evaluation[],

  /** Rows of the evaluation table shown on Home. */
  homeRows: 4,

  screen: { kind: 'drawn', seed: 'meridian-3' } as Screen,
  figureCaption:
    'The contour field, seeded with the model’s name. Every Meridian page carries its own variation.'
};
