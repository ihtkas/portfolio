import { readdirSync, readFileSync } from 'node:fs';

/** Reads the content folders directly so the e2e tests never hard-code a slug. Frontmatter only. */
export interface Entry {
  id: string;
  kind: string;
  draft: boolean;
  title: string;
  date: string;
  section: string;
  tags: string[];
  youtubeId: string;
}

function readEntries(dir: string): Entry[] {
  return readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const text = readFileSync(`${dir}/${f}`, 'utf8');
      const field = (name: string) =>
        new RegExp(`^\\s*${name}:\\s*(.+)$`, 'm').exec(text)?.[1]?.replace(/^'|'$/g, '') ?? '';
      const tags = field('tags');
      return {
        id: f.replace(/\.mdx?$/, ''),
        kind: field('kind'),
        draft: field('draft') === 'true',
        title: field('title'),
        date: field('date'),
        section: field('section'),
        tags: /^\[.+\]$/.test(tags) ? tags.slice(1, -1).split(',') : [],
        youtubeId: field('youtubeId'),
      };
    });
}

/** Published posts, newest first. */
export const posts = readEntries('src/content/posts')
  .filter((p) => !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date));
export const projects = readEntries('src/content/projects');
export const newestSlug = posts[0]?.id ?? '';
