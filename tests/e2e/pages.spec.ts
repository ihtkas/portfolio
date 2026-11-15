import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { site } from '../../site.config';
import { newestSlug, posts, projects } from './content';

const siteUrl = (process.env['SITE_URL'] ?? site.siteUrl).replace(/\/$/, '');

const olderOf = (i: number) => posts[i + 1]?.id;
const newerOf = (i: number) => posts[i - 1]?.id;
const years = (dates: string[]) => new Set(dates.map((d) => d.slice(0, 4))).size;

test.describe('writing index', () => {
  test.skip(posts.length === 0, 'needs at least one published post');
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
    const lifeYears = years(posts.filter((p) => p.kind === 'life').map((p) => p.date));
    await expect(page.locator('.year:visible')).toHaveCount(lifeYears);

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
  test.skip(posts.length === 0, 'needs at least one published post');

  test('has h1, reading time, tags and canonical', async ({ page }) => {
    await page.goto(`/writing/${newestSlug}/`);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.meta')).toContainText(/\d+ min read/);
    await expect(page.locator('.tags li')).toHaveCount(posts[0]?.tags.length ?? 0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${siteUrl}/writing/${newestSlug}/`,
    );
  });

  test('every post pager links to its date neighbours', async ({ page }) => {
    test.skip(posts.length < 2, 'needs at least two published posts');
    for (const [i, post] of posts.entries()) {
      await page.goto(`/writing/${post.id}/`);
      const newer = newerOf(i);
      const older = olderOf(i);
      const newerLink = page.locator('.pager .newer');
      const olderLink = page.locator('.pager .older');
      if (newer) await expect(newerLink).toHaveAttribute('href', `/writing/${newer}/`);
      else await expect(newerLink).toHaveCount(0);
      if (older) await expect(olderLink).toHaveAttribute('href', `/writing/${older}/`);
      else await expect(olderLink).toHaveCount(0);
    }
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
    expect(data['datePublished']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(data['dateModified']).toBeTruthy();
    expect((data['author'] as Record<string, unknown>)['@id']).toBe(`${siteUrl}/#person`);
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
      'content',
      String(data['datePublished']),
    );
  });
});

test.describe('projects', () => {
  test.skip(projects.length === 0, 'needs at least one project');

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
    const ossSections = new Set(projects.filter((p) => p.kind === 'oss').map((p) => p.section));
    await expect(page.locator('.year:visible')).toHaveCount(ossSections.size);

    await pill('At work').click();
    await expect(page.locator('.proj > li:visible')).toHaveCount(work);
    await expect(page.locator('.proj > li.oss:visible')).toHaveCount(0);
  });

  test('a project with video shows a facade', async ({ page }) => {
    await page.goto('/projects/');
    const withVideo = projects.filter((p) => p.youtubeId);
    test.skip(withVideo.length === 0, 'needs a project with a video (the sample ships one)');
    await expect(page.locator('a.vid')).toHaveCount(withVideo.length);
    await expect(page.locator('a.vid').first()).toHaveAttribute('data-youtube', /.+/);
  });
});

test.describe('resume', () => {
  test('shows every role, the skills and education panel, and a PDF link', async ({ page }) => {
    const resume = JSON.parse(readFileSync('src/data/resume.json', 'utf8')) as {
      pdf?: string;
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
    if (resume.pdf) {
      await expect(pdf).toHaveAttribute('href', resume.pdf);
      await expect(pdf).toHaveAttribute('download', '');
    } else {
      await expect(pdf).toHaveCount(0);
    }
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
    if (newestSlug) expect(xml).toContain(`${siteUrl}/writing/${newestSlug}/`);
  });

  test('rss.xml carries the full text, language and a self link', async ({ request }) => {
    const xml = await (await request.get('/rss.xml')).text();
    expect((xml.match(/<content:encoded>/g) ?? []).length).toBe(posts.length);
    expect(xml).toContain('<language>en</language>');
    expect(xml).toContain(`<atom:link href="${siteUrl}/rss.xml" rel="self"`);
    if (posts.length > 0) expect(xml).toContain('<lastBuildDate>');
    expect(xml).not.toMatch(/&lt;script/);
  });

  test('sitemap-index.xml exists and robots.txt points at it', async ({ request }) => {
    expect((await request.get('/sitemap-index.xml')).ok()).toBe(true);
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain(`Sitemap: ${siteUrl}/sitemap-index.xml`);
    expect(robots).toContain('Content-Signal: search=yes, ai-input=yes, ai-train=yes');
  });

  test('the sitemap has a lastmod for every post', async ({ request }) => {
    const xml = await (await request.get('/sitemap-0.xml')).text();
    for (const p of posts) {
      expect(xml).toMatch(
        new RegExp(`<loc>${siteUrl}/writing/${p.id}/</loc><lastmod>\\d{4}-\\d{2}-\\d{2}T`),
      );
    }
  });

  test('llms.txt has an H1, a summary and links each post as Markdown', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.ok()).toBe(true);
    const text = await res.text();
    expect(text.startsWith(`# ${site.name}\n\n> `)).toBe(true);
    for (const p of posts) expect(text).toContain(`(${siteUrl}/writing/${p.id}.md)`);
  });

  test('each post links a Markdown copy that serves its text', async ({ page, request }) => {
    test.skip(!newestSlug, 'needs at least one published post');
    await page.goto(`/writing/${newestSlug}/`);
    const href = await page
      .locator('link[rel="alternate"][type="text/markdown"]')
      .getAttribute('href');
    expect(href).toBe(`/writing/${newestSlug}.md`);
    const md = await (await request.get(href ?? '')).text();
    expect(md.startsWith('---\ntitle: ')).toBe(true);
    expect(md).toContain(`canonical: "${siteUrl}/writing/${newestSlug}/"`);
  });

  const jsonLd = async (page: Page, path: string) => {
    await page.goto(path);
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
    return JSON.parse(raw ?? '{}') as Record<string, unknown>;
  };

  test('the home page has Person and WebSite JSON-LD', async ({ page }) => {
    const graph = (await jsonLd(page, '/'))['@graph'] as Record<string, unknown>[];
    const person = graph.find((n) => n['@type'] === 'Person') ?? {};
    const website = graph.find((n) => n['@type'] === 'WebSite') ?? {};
    expect(person['@id']).toBe(`${siteUrl}/#person`);
    expect(person['name']).toBe(site.name);
    expect(person['url']).toBe(`${siteUrl}/`);
    expect(person['jobTitle']).toBeTruthy();
    expect(person['sameAs']).toEqual(
      expect.arrayContaining([site.socials.github, site.socials.linkedin]),
    );
    expect(website['url']).toBe(`${siteUrl}/`);
    expect(website['publisher']).toEqual({ '@id': `${siteUrl}/#person` });
  });

  test('/resume/ is a ProfilePage and /writing/ is a Blog', async ({ page }) => {
    const profile = await jsonLd(page, '/resume/');
    expect(profile['@type']).toBe('ProfilePage');
    expect((profile['mainEntity'] as Record<string, unknown>)['@id']).toBe(`${siteUrl}/#person`);
    const blog = await jsonLd(page, '/writing/');
    expect(blog['@type']).toBe('Blog');
    expect(blog['blogPost']).toHaveLength(posts.length);
  });

  test('the OG image has its size and alt text', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      'content',
      '1200',
    );
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
      'content',
      '630',
    );
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      'content',
      site.name,
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

  test('serves the OG image, and the resume PDF when one is configured', async ({ request }) => {
    const { pdf: pdfPath } = JSON.parse(readFileSync('src/data/resume.json', 'utf8')) as {
      pdf?: string;
    };
    if (pdfPath) {
      const pdf = await request.get(pdfPath);
      expect(pdf.ok()).toBe(true);
      expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
    }
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
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page).toHaveTitle(`Page not found | ${site.name}`);
    await expect(page.locator('main').getByRole('link', { name: /home/i })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
