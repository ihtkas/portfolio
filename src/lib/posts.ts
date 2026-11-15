import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

const WORDS_PER_MINUTE = 200;

export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** Newest first. Drafts are dropped unless `includeDrafts` (default: outside production). */
export function publishedPosts(
  all: Post[],
  { includeDrafts = !import.meta.env.PROD }: { includeDrafts?: boolean } = {},
): Post[] {
  return all
    .filter((p) => includeDrafts || !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Expects posts already sorted newest first. */
export function groupByYear(posts: Post[]): { year: number; posts: Post[] }[] {
  const groups: { year: number; posts: Post[] }[] = [];
  for (const post of posts) {
    const year = post.data.date.getFullYear();
    const last = groups[groups.length - 1];
    if (last?.year === year) last.posts.push(post);
    else groups.push({ year, posts: [post] });
  }
  return groups;
}

/** Expects posts already sorted newest first. */
export function neighbours(posts: Post[], slug: string): { newer?: Post; older?: Post } {
  const i = posts.findIndex((p) => p.id === slug);
  if (i === -1) return {};
  const newer = posts[i - 1];
  const older = posts[i + 1];
  return { ...(newer && { newer }), ...(older && { older }) };
}
