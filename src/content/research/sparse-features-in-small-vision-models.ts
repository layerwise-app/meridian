import type { Post } from '../types';

export default {
  slug: 'sparse-features-in-small-vision-models',
  title: 'Sparse features in small vision models',
  date: '2026-07-29',
  topic: 'Interpretability',
  authors: ['Mei-Lin Zhou', 'Callum Reid', 'Amara Okafor'],
  abstract:
    'We trained sparse dictionaries on the activations of a 90-million-parameter vision encoder and found that most features a person could name were already present in its middle layers: curve fragments, specular highlights, text-like strokes. A stubborn fifth of the dictionary resisted every description we could test. We describe how we scored interpretability without trusting our own eyes, and what the unnamed features have in common.',
  body: `
Most interpretability work on vision models has studied large ones, for good reasons: they are the models people deploy. We went the other way. A small model is cheap to probe exhaustively, which means you can ask not only "can we find interpretable features?" but "what fraction of the model can we explain at all?" The second question is the one we cared about.

## Why small models

The encoder we studied has 90 million parameters and twelve layers.[^size] It is not state of the art, but it is competent: it supports Meridian 3's image understanding at a fraction of the cost, and it was trained on the same data. If its internal representations are mostly legible, that tells us something about what larger encoders are likely to contain. If they are not, a small model is the cheapest place to find out why.

Earlier work on small language models found that sparse dictionaries recover directions that each respond to one recognisable thing [@ilves2024]. Vision has an extra difficulty: image patches overlap in content far more than tokens do, so a feature that looks clean on its top examples can turn out to be a mixture once you look further down the list.

## The dictionary

We trained one sparse autoencoder per layer on 2.1 billion patch activations, with a dictionary sixteen times wider than the layer itself.[^dict] Our earlier probing work [@zhou2025] suggested the middle layers would be the most interesting, and they were: layers six through eight hold most of the features that respond to parts of objects rather than raw texture or whole scenes.

What we found there will be familiar to anyone who has looked inside a vision model. There are curve detectors at many orientations, features for specular highlights, for the boundary between sky and anything else, for the repeated vertical strokes of printed text, and for fur. Many of them are strikingly clean.

## Scoring a feature without squinting

"Strikingly clean" is the problem. People are very good at finding a pattern in twenty images, which makes looking at top-activating examples a poor test of whether a feature is understood. Recent critiques of feature descriptions make the same point [@baptiste2025].

So we scored descriptions by whether they discriminate. For each feature, one person wrote a short description from its top examples. A different person then saw two shuffled sets of patches, one of top activations and one random, and had to say which set the description fit.[^raters] A feature's interpretability score is how much better than chance the second person did, scaled so that zero is chance and one is perfect.

::figure[density-vs-score]

Figure 1 shows the result for a random sample of features from layer seven. Most score well. The ones that score poorly are not concentrated at one end: very rare features and very common features both include failures, which rules out the easiest explanation, that we simply had too few examples of the rare ones.

## The fifth we could not name

About a fifth of the dictionary falls below 0.4, the point below which raters could not reliably distinguish a feature's top patches from random ones. We looked at these for a long time, and three things stood out.

First, many of them respond to position rather than content.[^position] They fire on patches at a fixed offset from an object's edge, whatever the object is. A person looking at the patches sees nothing in common because the thing in common is not in the patch.

Second, some seem to be parts of a larger feature split across several dictionary entries. Their activations are highly correlated with one or two neighbours, and descriptions of the group score well where descriptions of the individuals do not.

Third, a remainder, perhaps a third of the unnamed set, have no structure we could find with any method we tried. We do not know what they are.

::figure[layer-share]

## What this changes for us

The share of nameable features rises through the middle layers and falls again near the output, as Figure 2 shows, which matches the intuition that late layers combine parts into abstractions people do not have words for. That is a reason for humility about descriptions of large models' late layers, which are the ones most often studied.

For our own work, the practical change is that we now report an interpretability score alongside every feature we describe in a paper, and we report the fraction of the dictionary that falls below threshold. A claim that a model contains a feature for something is more useful when it comes with an estimate of how much of the model we could not explain at all.
`,
  sidenotes: [
    {
      id: 'size',
      text: 'Ninety million parameters is small by current standards. It fits on a single laptop GPU, which mattered more to us than its benchmark scores.'
    },
    {
      id: 'dict',
      text: 'We tuned the sparsity penalty so that an average patch activates about 38 features. Results were similar at 24 and 60.'
    },
    {
      id: 'raters',
      text: 'Raters saw 20 patches per set. Each description was tested by three raters, none of whom wrote it; we use the mean.'
    },
    {
      id: 'position',
      text: 'We confirmed this by pasting the same object at different offsets on a blank background. The features followed the offset, not the object.'
    }
  ],
  figures: [
    {
      id: 'density-vs-score',
      kind: 'scatter',
      caption:
        'Interpretability score against how often a feature fires, for 56 randomly sampled layer-seven features. Filled points fall below the 0.4 threshold; they appear at every density.',
      xLabel: 'Share of patches that activate the feature (log scale)',
      yLabel: 'Interpretability score',
      xDomain: [0.01, 10],
      yDomain: [0, 1],
      xLog: true,
      threshold: { y: 0.4, label: 'Threshold 0.4' },
      points: [
        { x: 0.094, y: 0.2, highlight: true },
        { x: 0.405, y: 0.93 },
        { x: 0.125, y: 0.91 },
        { x: 0.013, y: 0.64 },
        { x: 0.2, y: 0.83 },
        { x: 0.188, y: 0.41 },
        { x: 0.024, y: 0.68 },
        { x: 6.968, y: 0.71 },
        { x: 0.539, y: 0.48 },
        { x: 0.014, y: 0.8 },
        { x: 3.762, y: 0.21, highlight: true },
        { x: 0.084, y: 0.82 },
        { x: 2.808, y: 0.72 },
        { x: 0.826, y: 0.9 },
        { x: 0.131, y: 0.73 },
        { x: 0.015, y: 0.24, highlight: true },
        { x: 1.1, y: 0.63 },
        { x: 0.571, y: 0.81 },
        { x: 0.229, y: 0.71 },
        { x: 1.25, y: 0.94 },
        { x: 0.054, y: 0.43 },
        { x: 1.543, y: 0.63 },
        { x: 0.073, y: 0.81 },
        { x: 0.18, y: 0.77 },
        { x: 1.868, y: 0.78 },
        { x: 0.013, y: 0.37, highlight: true },
        { x: 1.967, y: 0.45 },
        { x: 0.087, y: 0.64 },
        { x: 1.219, y: 0.58 },
        { x: 0.234, y: 0.68 },
        { x: 3.311, y: 0.37, highlight: true },
        { x: 0.015, y: 0.55 },
        { x: 1.272, y: 0.47 },
        { x: 2.923, y: 0.32, highlight: true },
        { x: 0.071, y: 0.6 },
        { x: 0.012, y: 0.31, highlight: true },
        { x: 0.032, y: 0.72 },
        { x: 2.017, y: 0.71 },
        { x: 0.024, y: 0.66 },
        { x: 4.114, y: 0.73 },
        { x: 0.017, y: 0.43 },
        { x: 2.87, y: 0.7 },
        { x: 3.908, y: 0.59 },
        { x: 0.119, y: 0.9 },
        { x: 4.493, y: 0.66 },
        { x: 0.034, y: 0.24, highlight: true },
        { x: 0.05, y: 0.55 },
        { x: 0.061, y: 0.75 },
        { x: 0.01, y: 0.44 },
        { x: 0.5, y: 0.83 },
        { x: 7.233, y: 0.35, highlight: true },
        { x: 1.068, y: 0.59 },
        { x: 0.015, y: 0.78 },
        { x: 4.203, y: 0.47 },
        { x: 2.475, y: 0.56 },
        { x: 0.02, y: 0.36, highlight: true }
      ]
    },
    {
      id: 'layer-share',
      kind: 'bars',
      caption:
        'Share of each layer’s dictionary scoring above the 0.4 threshold. Nameable features peak in the middle layers.',
      yLabel: 'Features above threshold',
      categories: ['L2', 'L4', 'L6', 'L7', 'L8', 'L10', 'L12'],
      yDomain: [0, 100],
      yUnit: '%',
      series: [
        {
          name: 'Above threshold',
          values: [41, 63, 78, 81, 79, 68, 55],
          accent: true
        }
      ]
    }
  ],
  citations: [
    {
      key: 'ilves2024',
      authors: 'R. Ilves and P. Marchetti',
      title: 'Dictionary learning recovers single-concept directions in small transformers',
      venue: 'Workshop on Mechanistic Interpretability',
      year: 2024
    },
    {
      key: 'zhou2025',
      authors: 'M.-L. Zhou and C. Reid',
      title: 'Patch-level probes for attention-based image encoders',
      venue: 'Meridian Technical Report MR-2025-03',
      year: 2025
    },
    {
      key: 'baptiste2025',
      authors: 'N. Baptiste',
      title: 'Sanity checks for natural-language feature descriptions',
      venue: 'Transactions on Machine Learning Methods, 3',
      year: 2025
    }
  ]
} satisfies Post;
