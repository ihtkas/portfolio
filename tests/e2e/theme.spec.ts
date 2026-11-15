import { expect, test } from '@playwright/test';

const pages = [
  { path: '/', label: 'Home' },
  { path: '/writing/', label: 'Writing' },
  { path: '/projects/', label: 'Projects' },
  { path: '/resume/', label: 'Resume' },
];

test.use({ colorScheme: 'dark' });

test.describe('navigation', () => {
  for (const { path, label } of pages) {
    test(`aria-current marks ${label} on ${path}`, async ({ page }) => {
      await page.goto(path);
      const current = page.locator('header nav a[aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveText(label);
    });
  }
});

test.describe('theme toggle', () => {
  test.beforeEach(({ javaScriptEnabled }) => {
    test.skip(!javaScriptEnabled, 'needs JavaScript');
  });

  test('click sets data-theme and survives navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to light theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.goto('/writing/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('stored choice applies at domcontentloaded', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('light');
  });

  test('aria-label flips on toggle', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('header button[aria-label^="Switch to"]');
    await expect(toggle).toHaveAttribute('aria-label', 'Switch to light theme');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark theme');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-label', 'Switch to light theme');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
  });

  test('prefers-color-scheme decides without a stored choice', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    await page.goto('/');
    const toggle = page.locator('header button[aria-label^="Switch to"]');
    await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark theme');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(235, 233, 227)');
    await context.close();
  });
});
