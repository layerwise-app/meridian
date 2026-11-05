import { createServerFn } from '@tanstack/react-start';
import { getPost, posts, readingMinutes, summarize } from '~/content/posts';

// Post content stays on the server and reaches pages through these loaders,
// so the browser bundle doesn't grow with every post.

export const listPosts = createServerFn({ method: 'GET' }).handler(() =>
  posts.map(summarize)
);

export const loadPost = createServerFn({ method: 'GET' })
  .validator((slug: string) => {
    if (typeof slug !== 'string' || !/^[a-z0-9-]{1,120}$/.test(slug)) {
      return '';
    }
    return slug;
  })
  .handler(({ data: slug }) => {
    const post = getPost(slug);
    if (!post) return null;
    const index = posts.indexOf(post);
    const neighbour = (i: number) =>
      posts[i] ? { slug: posts[i].slug, title: posts[i].title } : null;
    return {
      post,
      readingMinutes: readingMinutes(post),
      newer: neighbour(index - 1),
      older: neighbour(index + 1)
    };
  });
