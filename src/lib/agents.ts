// Plain-text views of the site for feeds, crawlers and AI agents: llms.txt, a Markdown copy of each
// post, and absolute URLs for feed HTML. Everything comes from site.config.ts and the collections.
import sanitizeHtml from 'sanitize-html';
import type { SiteConfig } from './site';
import type { Post } from './posts';
import type { Project } from './projects';

/** Where the Markdown copy of a post is served. */
export const postMarkdownPath = (slug: string): string => `/writing/${slug}.md`;

/** Posts and projects date to the day; use noon UTC so the date reads the same in every zone. */
export const isoDateTime = (d: Date): string => `${d.toISOString().slice(0, 10)}T12:00:00Z`;

/** The newest `updated ?? date` across posts, if any. */
export function lastModified(posts: Post[]): Date | undefined {
  const times = posts.map((p) => (p.data.updated ?? p.data.date).getTime());
  return times.length ? new Date(Math.max(...times)) : undefined;
}

// JSON strings are valid YAML scalars, so this quotes anything safely.
const yaml = (value: string): string => JSON.stringify(value);

/** A post as Markdown: YAML front matter, the title, then the source body. */
export function postMarkdown(post: Post, url: string): string {
  const { title, dek, date, updated, tags } = post.data;
  const day = (d: Date) => d.toISOString().slice(0, 10);
  let body = (post.body ?? '').trim();
  // MDX: drop the import and export lines, which mean nothing outside the site.
  if (post.filePath?.endsWith('.mdx')) {
    body = body.replace(/^(import|export)\s.*$/gm, '').trim();
  }
  return [
    '---',
    `title: ${yaml(title)}`,
    `description: ${yaml(dek)}`,
    `date: ${day(date)}`,
    ...(updated ? [`updated: ${day(updated)}`] : []),
    `tags: [${tags.map(yaml).join(', ')}]`,
    `canonical: ${yaml(url)}`,
    '---',
    '',
    `# ${title}`,
    '',
    body,
    '',
  ].join('\n');
}

const projectLink = (p: Project): string =>
  p.data.links.github ?? p.data.links.demo ?? p.data.links.writeup ?? '/projects/';

/** llms.txt in the llmstxt.org format: H1, blockquote summary, then H2 sections of links. */
export function llmsTxt(
  site: SiteConfig,
  posts: Post[],
  projects: Project[],
  base: URL | string,
): string {
  const abs = (path: string) => new URL(path, base).href;
  const item = (title: string, href: string, note: string) => `- [${title}](${abs(href)}): ${note}`;
  const lines = [`# ${site.name}`, '', `> ${site.description}`, '', site.about, ''];
  if (posts.length > 0) {
    lines.push('## Writing', '');
    for (const p of posts) lines.push(item(p.data.title, postMarkdownPath(p.id), p.data.dek));
    lines.push('');
  }
  if (projects.length > 0) {
    lines.push('## Projects', '');
    for (const p of [...projects].sort((a, b) => a.data.order - b.data.order)) {
      lines.push(item(p.data.title, projectLink(p), p.data.summary));
    }
    lines.push('');
  }
  lines.push('## Pages', '');
  lines.push(item('Home', '/', site.tagline));
  if (posts.length > 0) lines.push(item('Writing', '/writing/', site.pages.writing.lede));
  if (projects.length > 0) lines.push(item('Projects', '/projects/', site.pages.projects.lede));
  lines.push(item('Resume', '/resume/', `Experience, skills and education of ${site.name}.`));
  lines.push('');
  const optional: string[] = [];
  if (site.socials.rss) optional.push(item('RSS feed', '/rss.xml', 'Every post in full.'));
  if (site.socials.github) optional.push(`- [GitHub](${site.socials.github})`);
  if (site.socials.linkedin) optional.push(`- [LinkedIn](${site.socials.linkedin})`);
  if (optional.length > 0) lines.push('## Optional', '', ...optional, '');
  return lines.join('\n');
}

/** Rendered post HTML made safe for a feed: no scripts, styles or classes, absolute URLs. */
export function feedHtml(html: string, base: URL | string): string {
  const absolute = (value: string | undefined) => {
    if (!value || value.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(value)) return value;
    return new URL(value, base).href;
  };
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt', 'width', 'height'],
      code: [],
      pre: [],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, href: absolute(attribs['href']) ?? '' },
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, src: absolute(attribs['src']) ?? '' },
      }),
    },
  });
}
