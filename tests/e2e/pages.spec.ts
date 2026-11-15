import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { site } from '../../site.config';

const siteUrl = (process.env['SITE_URL'] ?? site.siteUrl).replace(/\/$/, '');

interface Entry {
  id: string;
  kind: string;
  draft: boolean;
  title: string;
}

function readEntries(dir: string): Entry[] {
  return readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const text = readFileSync(`${dir}/${f}`, 'utf8');
      const field = (name: string) =>
        new RegExp(`^${name}:\\s*(.+)$`, 'm').exec(text)?.[1]?.replace(/^'|'$/g, '') ?? '';
      return {
        id: f.replace(/\.mdx?$/, ''),
        kind: field('kind'),
        draft: field('draft') === 'true',
        title: field('title'),
      };
    });
}

const posts = readEntries('src/content/posts').filter((p) => !p.draft);
const projects = readEntries('src/content/projects');
const newestSlug = 'sample-engineering-post';
const oldestSlug = 'sample-life-post';

test.describe('writing index', () => {
  test('filter counts match the data and filtering hides rows and empty years', async ({
    page,
  }) => {
    await page.goto('/writing/');
    const eng = posts.filter((p) => p.kind === 'engineering').length;
    const life = posts.filter((p) => p.kind === 'life').length;
    const pill = (name: string) => page.locator('.filter label', { hasText: name });
    await expect(pill('All').locator('small')).toHaveText(String(posts.length));
    await expect(pill('Engineering').locator('small')).toHaveText(String(eng));
    await expect(pill('Life').locator('small')).toHaveText(String(life));
    await expect(page.locator('.rows li:visible')).toHaveCount(posts.length);

    await pill('Engineering').click();
    await expect(page.locator('.rows li:visible')).toHaveCount(eng);
    await expect(page.locator('.rows li.life:visible')).toHaveCount(0);

    await pill('Life').click();
    await expect(page.locator('.rows li:visible')).toHaveCount(life);
    // sample posts fall in different years, so the other year group must hide
    await expect(page.locator('.year:visible')).toHaveCount(1);

    await pill('All').click();
    await expect(page.locator('.year:visible')).toHaveCount(await page.locator('.year').count());
  });

  test('has an h1 and links each post', async ({ page }) => {
    await page.goto('/writing/');
    await expect(page.locator('h1')).toHaveText('Writing');
    await expect(page.locator(`a[href="/writing/${newestSlug}/"]`)).toBeVisible();
  });
});

test.describe('post page', () => {
  test('has h1, reading time, tags and canonical', async ({ page }) => {
    await page.goto(`/writing/${newestSlug}/`);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.meta')).toContainText(/\d+ min read/);
    await expect(page.locator('.tags li')).not.toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${siteUrl}/writing/${newestSlug}/`,
    );
  });

  test('the newest post has no Newer link and Older goes to the next slug', async ({ page }) => {
    await page.goto(`/writing/${newestSlug}/`);
    await expect(page.locator('.pager .newer')).toHaveCount(0);
    await expect(page.locator('.pager .older')).toHaveAttribute('href', `/writing/${oldestSlug}/`);
  });

  test('the oldest post has no Older link and Newer goes to the previous slug', async ({
    page,
  }) => {
    await page.goto(`/writing/${oldestSlug}/`);
    await expect(page.locator('.pager .older')).toHaveCount(0);
    await expect(page.locator('.pager .newer')).toHaveAttribute('href', `/writing/${newestSlug}/`);
  });

  test('does not scroll sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(`/writing/${newestSlug}/`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('has BlogPosting JSON-LD', async ({ page }) => {
    await page.goto(`/writing/${newestSlug}/`);
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(raw ?? '{}') as Record<string, unknown>;
    expect(data['@type']).toBe('BlogPosting');
    expect(data['url']).toBe(`${siteUrl}/writing/${newestSlug}/`);
    expect(data['headline']).toBeTruthy();
    expect(data['datePublished']).toBeTruthy();
  });
});

test.describe('projects', () => {
  test('filters work and counts match', async ({ page }) => {
    await page.goto('/projects/');
    const oss = projects.filter((p) => p.kind === 'oss').length;
    const work = projects.length - oss;
    const pill = (name: string) => page.locator('.filter label', { hasText: name });
    await expect(pill('All').locator('small')).toHaveText(String(projects.length));
    await expect(pill('Open source').locator('small')).toHaveText(String(oss));
    await expect(pill('At work').locator('small')).toHaveText(String(work));
    await expect(page.locator('.proj > li:visible')).toHaveCount(projects.length);

    await pill('Open source').click();
    await expect(page.locator('.proj > li:visible')).toHaveCount(oss);
    await expect(page.locator('.year:visible')).toHaveCount(1);

    await pill('At work').click();
    await expect(page.locator('.proj > li:visible')).toHaveCount(work);
    await expect(page.locator('.proj > li.oss:visible')).toHaveCount(0);
  });

  test('a project with video shows a facade', async ({ page }) => {
    await page.goto('/projects/');
    await expect(page.locator('a.vid')).toHaveCount(1);
    await expect(page.locator('a.vid')).toHaveAttribute('data-youtube', /.+/);
  });
});

test.describe('resume', () => {
  test('shows every role, the skills and education panel, and a PDF link', async ({ page }) => {
    const resume = JSON.parse(readFileSync('src/data/resume.json', 'utf8')) as {
      orgs: { roles: { title: string }[] }[];
      education: { school: string }[];
      skills: Record<string, string[]>;
    };
    await page.goto('/resume/');
    const roles = resume.orgs.flatMap((o) => o.roles);
    await expect(page.locator('article.role')).toHaveCount(roles.length);
    for (const role of roles) {
      await expect(page.locator('article.role h3', { hasText: role.title }).first()).toBeVisible();
    }
    const panel = page.getByRole('complementary', { name: 'Skills and education' });
    await expect(panel).toBeVisible();
    for (const group of Object.keys(resume.skills)) await expect(panel).toContainText(group);
    for (const e of resume.education) await expect(panel).toContainText(e.school);
    const pdf = page.getByRole('link', { name: /download pdf/i });
    await expect(pdf).toHaveAttribute('href', '/resume.pdf');
    await expect(pdf).toHaveAttribute('download', '');
  });
});

test.describe('feeds and SEO', () => {
  test('rss.xml is valid XML with one item per published post', async ({ request }) => {
    const res = await request.get('/rss.xml');
    expect(res.ok()).toBe(true);
    const xml = await res.text();
    expect(xml).toMatch(/^<\?xml/);
    expect(xml).toContain('<rss');
    expect((xml.match(/<item>/g) ?? []).length).toBe(posts.length);
    expect((xml.match(/<\/item>/g) ?? []).length).toBe(posts.length);
    expect(xml).toContain(`${siteUrl}/writing/${newestSlug}/`);
  });

  test('sitemap-index.xml exists and robots.txt points at it', async ({ request }) => {
    expect((await request.get('/sitemap-index.xml')).ok()).toBe(true);
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain(`Sitemap: ${siteUrl}/sitemap-index.xml`);
  });

  test('the home page has Person JSON-LD', async ({ page }) => {
    await page.goto('/');
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(raw ?? '{}') as Record<string, unknown>;
    expect(data['@type']).toBe('Person');
    expect(data['name']).toBe(site.name);
    expect(data['url']).toBe(`${siteUrl}/`);
    expect(data['sameAs']).toEqual(
      expect.arrayContaining([site.socials.github, site.socials.linkedin]),
    );
  });

  for (const path of ['/', '/writing/', '/projects/', '/resume/']) {
    test(`${path} has a canonical link from SITE_URL`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `${siteUrl}${path}`,
      );
    });
  }

  test('serves the resume placeholder PDF and OG image', async ({ request }) => {
    const pdf = await request.get('/resume.pdf');
    expect(pdf.ok()).toBe(true);
    expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
    const og = await request.get('/og-default.png');
    expect(og.ok()).toBe(true);
    expect(og.headers()['content-type']).toContain('image/png');
  });
});

test.describe('404', () => {
  test('an unknown path renders the 404 page with a link home', async ({ page }) => {
    const res = await page.goto('/no-such-page/');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main').getByRole('link', { name: /home/i })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
