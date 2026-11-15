import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lastmodByPath } from '../../integrations/lastmod';
import {
  feedHtml,
  isoDateTime,
  lastModified,
  llmsTxt,
  postMarkdown,
  postMarkdownPath,
} from '../../src/lib/agents';
import type { Post } from '../../src/lib/posts';
import type { Project } from '../../src/lib/projects';
import type { SiteConfig } from '../../src/lib/site';

const post = (id: string, date: string, body = 'Body text.', extra: object = {}) =>
  ({
    id,
    body,
    filePath: `src/content/posts/${id}.md`,
    data: { title: `T ${id}`, date: new Date(date), dek: `Dek ${id}`, tags: ['a', 'b'], ...extra },
  }) as unknown as Post;

const project = (id: string, order: number, links: object) =>
  ({ id, data: { title: `P ${id}`, summary: `S ${id}`, order, links } }) as unknown as Project;

const site = {
  name: 'Ada',
  tagline: 'Tag',
  description: 'Desc',
  about: 'About me.',
  socials: { github: 'https://github.com/x', rss: true },
  pages: { writing: { lede: 'W' }, projects: { lede: 'P' } },
} as unknown as SiteConfig;

describe('postMarkdown', () => {
  it('writes front matter, a title and the body', () => {
    const md = postMarkdown(post('x', '2026-01-02', 'Hello "world".'), 'https://e.com/writing/x/');
    expect(md).toBe(
      [
        '---',
        'title: "T x"',
        'description: "Dek x"',
        'date: 2026-01-02',
        'tags: ["a", "b"]',
        'canonical: "https://e.com/writing/x/"',
        '---',
        '',
        '# T x',
        '',
        'Hello "world".',
        '',
      ].join('\n'),
    );
  });
  it('adds updated and drops MDX import lines', () => {
    const p = post('y', '2026-01-02', "import X from './x';\n\nText <X />", {
      updated: new Date('2026-02-03'),
    });
    (p as { filePath: string }).filePath = 'src/content/posts/y.mdx';
    const md = postMarkdown(p, 'u');
    expect(md).toContain('updated: 2026-02-03');
    expect(md).not.toContain('import X');
    expect(md).toContain('Text <X />');
  });
});

describe('llmsTxt', () => {
  const text = llmsTxt(
    site,
    [post('new', '2026-02-01'), post('old', '2026-01-01')],
    [project('b', 2, {}), project('a', 1, { github: 'https://github.com/x/a' })],
    'https://e.com',
  );
  it('starts with the H1 and blockquote summary', () => {
    expect(text.startsWith('# Ada\n\n> Desc\n\nAbout me.\n')).toBe(true);
  });
  it('links posts to their Markdown copies and orders projects', () => {
    expect(text).toContain(`- [T new](https://e.com${postMarkdownPath('new')}): Dek new`);
    expect(text.indexOf('[P a](https://github.com/x/a)')).toBeLessThan(
      text.indexOf('[P b](https://e.com/projects/)'),
    );
    expect(text).toContain('## Optional');
  });
  it('omits empty sections', () => {
    const empty = llmsTxt(site, [], [], 'https://e.com');
    expect(empty).not.toContain('## Writing');
    expect(empty).not.toContain('## Projects');
    expect(empty).toContain('[Resume](https://e.com/resume/)');
  });
});

describe('feedHtml', () => {
  it('strips scripts, styles and classes, and makes URLs absolute', () => {
    const html = feedHtml(
      '<p class="x" style="color:red">Hi <a href="/projects/">p</a> <a href="#n">n</a></p>' +
        '<script>alert(1)</script><img src="/a.png" alt="A" onerror="x()">',
      'https://e.com/writing/x/',
    );
    expect(html).toBe(
      '<p>Hi <a href="https://e.com/projects/">p</a> <a href="#n">n</a></p>' +
        '<img src="https://e.com/a.png" alt="A" />',
    );
  });
});

describe('dates', () => {
  it('isoDateTime pins a date to noon UTC', () => {
    expect(isoDateTime(new Date('2026-11-14'))).toBe('2026-11-14T12:00:00Z');
  });
  it('lastModified prefers updated', () => {
    const d = lastModified([
      post('a', '2026-01-01'),
      post('b', '2025-01-01', '', { updated: new Date('2026-03-01') }),
    ]);
    expect(d?.toISOString().slice(0, 10)).toBe('2026-03-01');
    expect(lastModified([])).toBeUndefined();
  });
});

describe('lastmodByPath', () => {
  it('reads date and updated, skips drafts, and dates the listing pages', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lastmod-'));
    writeFileSync(join(dir, 'a.md'), '---\ntitle: A\ndate: 2026-01-01\n---\nx');
    writeFileSync(join(dir, 'b.mdx'), "---\ndate: '2026-01-05'\nupdated: 2026-02-01\n---\nx");
    writeFileSync(join(dir, 'c.md'), '---\ndate: 2026-05-01\ndraft: true\n---\nx');
    const map = lastmodByPath(dir);
    expect(map.get('/writing/a/')?.toISOString().slice(0, 10)).toBe('2026-01-01');
    expect(map.get('/writing/b/')?.toISOString().slice(0, 10)).toBe('2026-02-01');
    expect(map.has('/writing/c/')).toBe(false);
    expect(map.get('/')?.toISOString().slice(0, 10)).toBe('2026-02-01');
  });
});
