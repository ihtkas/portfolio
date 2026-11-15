import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test.describe('fast navigation', () => {
  test('nav pages are prefetched before any click', async ({ page }, info) => {
    test.skip(info.project.use.javaScriptEnabled === false, 'prefetch needs JavaScript');
    const prefetched = page.waitForRequest((r) => new URL(r.url()).pathname === '/projects/');
    await page.goto('/');
    await prefetched;
  });

  test('other links are prefetched on hover', async ({ page }, info) => {
    test.skip(info.project.use.javaScriptEnabled === false, 'prefetch needs JavaScript');
    await page.goto('/writing/');
    const link = page.locator('main a[href^="/writing/"]').first();
    const href = await link.getAttribute('href');
    const prefetched = page.waitForRequest((r) => new URL(r.url()).pathname === href);
    await link.hover();
    await prefetched;
  });

  test('fingerprinted assets are cached for a year', () => {
    const headers = readFileSync('dist/_headers', 'utf8');
    expect(headers).toMatch(/\/_astro\/\*\s+Cache-Control: public, max-age=31536000, immutable/);
  });
});
