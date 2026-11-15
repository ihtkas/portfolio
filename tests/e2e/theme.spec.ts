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

test.describe('without JavaScript', () => {
  test.beforeEach(({ javaScriptEnabled }) => {
    test.skip(javaScriptEnabled, 'nojs only');
  });

  test('the toggle is hidden and the nav links still work', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-theme-toggle]')).toBeHidden();
    await page.locator('header nav').getByRole('link', { name: 'Writing' }).click();
    await expect(page).toHaveURL(/\/writing\/$/);
    await page.locator('header nav').getByRole('link', { name: 'Resume' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
  });
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

  test('stored dark wins over a light system preference', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('[data-theme-toggle]')).toHaveAttribute(
      'aria-label',
      'Switch to light theme',
    );
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe('rgb(235, 233, 227)');
    await context.close();
  });

  test('an invalid stored value is ignored', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    await context.addInitScript(() => localStorage.setItem('theme', 'purple'));
    const page = await context.newPage();
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBeUndefined();
    await expect(page.locator('[data-theme-toggle]')).toHaveAttribute(
      'aria-label',
      'Switch to dark theme',
    );
    await context.close();
  });

  test('throwing storage still renders and follows the system', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('blocked');
        },
      });
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('[data-theme-toggle]')).toHaveAttribute(
      'aria-label',
      'Switch to dark theme',
    );
    // the click still switches this page even though it cannot persist
    await page.locator('[data-theme-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await context.close();
  });

  test('a system-light visitor never sees the wrong label', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await page.locator('[data-theme-toggle]').getAttribute('aria-label')).toBe(
      'Switch to dark theme',
    );
    await context.close();
  });
});
