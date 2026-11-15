// Sitemap <lastmod> values from the post front matter. astro.config.ts cannot use content
// collections, so this reads `date`, `updated` and `draft` straight from the files.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Path ("/writing/<slug>/") to its last modified date, plus "/" and "/writing/" for the newest. */
export function lastmodByPath(postsDir = 'src/content/posts'): Map<string, Date> {
  const map = new Map<string, Date>();
  if (!existsSync(postsDir)) return map;
  let newest: Date | undefined;
  for (const file of readdirSync(postsDir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const front = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(postsDir, file), 'utf8'))?.[1];
    if (!front) continue;
    const field = (name: string) =>
      new RegExp(`^${name}:\\s*['"]?([^'"\\n]+?)['"]?\\s*$`, 'm').exec(front)?.[1];
    if (field('draft') === 'true') continue;
    const value = field('updated') ?? field('date');
    const date = value ? new Date(value) : undefined;
    if (!date || Number.isNaN(date.getTime())) continue;
    map.set(`/writing/${file.replace(/\.mdx?$/, '')}/`, date);
    if (!newest || date > newest) newest = date;
  }
  if (newest) {
    map.set('/', newest);
    map.set('/writing/', newest);
  }
  return map;
}
