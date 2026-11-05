import type { Post, Topic } from './types';

/**
 * Every file in `src/content/research/` is a post. Adding one puts it on Home
 * (if it's among the newest three), the research index, and the sitemap.
 */
const modules = import.meta.glob<{ default: Post }>('./research/*.ts', {
  eager: true
});

export const posts: Post[] = Object.entries(modules)
  .map(([path, module]) => {
    const post = module.default;
    const file = path.split('/').pop()!.replace(/\.ts$/, '');
    if (post.slug !== file) {
      throw new Error(
        `Post slug "${post.slug}" must match its file name "${file}.ts".`
      );
    }
    return post;
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

export function postPath(slug: string) {
  return `/research/${slug}`;
}

const WORDS_PER_MINUTE = 230;

/** Estimated reading time in whole minutes, counting the body or the abstract. */
export function readingMinutes(post: Pick<Post, 'body' | 'abstract'>) {
  const text = (post.body ?? post.abstract)
    .replace(/\[\^[\w-]+\]|\[@[^\]]+\]|::figure\[[^\]]+\]/g, ' ')
    .replace(/[#*>`_[\]()]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** What lists and tables need: everything but the body. */
export type PostSummary = {
  slug: string;
  title: string;
  date: string;
  topic: Topic;
  authors: string[];
  abstract: string;
  hasBody: boolean;
  readingMinutes: number;
};

export function summarize(post: Post): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    topic: post.topic,
    authors: post.authors,
    abstract: post.abstract,
    hasBody: Boolean(post.body),
    readingMinutes: readingMinutes(post)
  };
}
