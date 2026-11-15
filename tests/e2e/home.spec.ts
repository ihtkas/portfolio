import { expect, test } from '@playwright/test';
import { site } from '../../site.config';
import { posts, projects } from './content';

// The first featured project that has a video is the first `a.vid` on the home page.
const featuredVideoId = site.featured
  .flatMap((ref) => (ref.kind === 'project' ? [projects.find((p) => p.id === ref.slug)] : []))
  .find((p) => p?.youtubeId)?.youtubeId;

test.describe('home page', () => {
  test('has a visually hidden h1 with the owner name', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(site.name);
    await expect(h1).toHaveClass(/sr/);
  });

  test('latest writing shows at most 3 posts and links to all writing', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('#s3 .rows li');
    expect(await rows.count()).toBe(Math.min(posts.length, 3));
    await expect(page.getByRole('link', { name: 'All writing' })).toHaveAttribute(
      'href',
      '/writing/',
    );
    await expect(page.getByRole('link', { name: 'All projects' })).toHaveAttribute(
      'href',
      '/projects/',
    );
  });

  test('shows a LinkedIn "Say hello" link when no email is configured', async ({ page }) => {
    await page.goto('/');
    const hello = page.getByRole('link', { name: 'Say hello' });
    await expect(hello).toHaveAttribute('href', /linkedin\.com/);
  });
});

test.describe('featured slideshow', () => {
  test.beforeEach(({ javaScriptEnabled }) => {
    test.skip(!javaScriptEnabled, 'needs JavaScript');
    test.skip(site.featured.length < 2, 'needs at least two featured items');
  });

  const dots = (page: import('@playwright/test').Page) => page.locator('.reel .dots button');

  test('starts on slide 1 and advances to dot 2 after 7.5 s', async ({ page }) => {
    await page.mouse.move(0, 0);
    await page.goto('/');
    await expect(dots(page).nth(0)).toHaveAttribute('aria-current', 'true');
    await expect(dots(page).nth(1)).toHaveAttribute('aria-current', 'false', { timeout: 1000 });
    await page.waitForTimeout(7500);
    await expect(dots(page).nth(1)).toHaveAttribute('aria-current', 'true');
  });

  test('does not advance while hovered', async ({ page }) => {
    await page.goto('/');
    await page.locator('.reel').hover();
    await page.waitForTimeout(8000);
    await expect(dots(page).nth(0)).toHaveAttribute('aria-current', 'true');
  });

  test('stays on slide 1 under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.mouse.move(0, 0);
    await page.goto('/');
    await page.waitForTimeout(8000);
    await expect(dots(page).nth(0)).toHaveAttribute('aria-current', 'true');
  });

  test('next and previous buttons move between slides', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Next slide' }).click();
    await expect(dots(page).nth(1)).toHaveAttribute('aria-current', 'true');
    await page.getByRole('button', { name: 'Previous slide' }).click();
    await expect(dots(page).nth(0)).toHaveAttribute('aria-current', 'true');
  });

  test('a dot jumps to its slide', async ({ page }) => {
    await page.goto('/');
    await dots(page).nth(1).click();
    await expect(dots(page).nth(1)).toHaveAttribute('aria-current', 'true');
  });
});

test.describe('slideshow without JavaScript', () => {
  test('hides the controls but keeps the slides visible', async ({ page, javaScriptEnabled }) => {
    test.skip(javaScriptEnabled, 'nojs only');
    test.skip(site.featured.length === 0, 'needs a featured item');
    await page.goto('/');
    await expect(page.locator('.reel .ctrl')).toBeHidden();
    await expect(page.locator('.reel .slide').first()).toBeVisible();
  });
});

test.describe('video facade', () => {
  test('no youtube or ytimg request before a click', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (r) => {
      if (/youtube|ytimg/.test(r.url())) hits.push(r.url());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(hits).toEqual([]);
  });

  test('without JS the facade is a plain link to YouTube', async ({ page, javaScriptEnabled }) => {
    test.skip(javaScriptEnabled, 'nojs only');
    test.skip(!featuredVideoId, 'needs a featured project with a video (the sample ships one)');
    await page.goto('/');
    await expect(page.locator('a.vid').first()).toHaveAttribute(
      'href',
      `https://www.youtube.com/watch?v=${featuredVideoId}`,
    );
  });

  test('clicking adds a youtube-nocookie iframe', async ({ page, javaScriptEnabled }) => {
    test.skip(!javaScriptEnabled, 'needs JavaScript');
    test.skip(!featuredVideoId, 'needs a featured project with a video (the sample ships one)');
    await page.route('**/*youtube*', (r) => r.abort());
    await page.goto('/');
    await page.locator('a.vid').first().click();
    const frame = page.locator('.reel iframe');
    await expect(frame).toHaveCount(1);
    const src = (await frame.getAttribute('src')) ?? '';
    expect(new URL(src).host).toBe('www.youtube-nocookie.com');
    expect(src).toContain(`/embed/${featuredVideoId}`);
    expect(src).toContain('autoplay=1');
  });
});
