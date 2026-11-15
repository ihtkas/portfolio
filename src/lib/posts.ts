import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

const WORDS_PER_MINUTE = 200;

export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

const newestFirst = (posts: Post[]): Post[] =>
  [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

/** Newest first. Drafts are dropped unless `includeDrafts` (default: outside production). */
export function publishedPosts(
  all: Post[],
  { includeDrafts = !import.meta.env.PROD }: { includeDrafts?: boolean } = {},
): Post[] {
  return newestFirst(all.filter((p) => includeDrafts || !p.data.draft));
}

/** Groups by UTC year, newest first. Sorts a copy, so input order does not matter. */
export function groupByYear(posts: Post[]): { year: number; posts: Post[] }[] {
  const groups: { year: number; posts: Post[] }[] = [];
  for (const post of newestFirst(posts)) {
    const year = post.data.date.getUTCFullYear();
    const last = groups[groups.length - 1];
    if (last?.year === year) last.posts.push(post);
    else groups.push({ year, posts: [post] });
  }
  return groups;
}

/** Newer and older neighbours of `slug`. Sorts a copy, so input order does not matter. */
export function neighbours(posts: Post[], slug: string): { newer?: Post; older?: Post } {
  const sorted = newestFirst(posts);
  const i = sorted.findIndex((p) => p.id === slug);
  if (i === -1) return {};
  const newer = sorted[i - 1];
  const older = sorted[i + 1];
  return { ...(newer && { newer }), ...(older && { older }) };
}
