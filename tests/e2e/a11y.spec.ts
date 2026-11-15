import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { routes } from './routes';

const themes = ['dark', 'light'] as const;

test.describe('axe', () => {
  // the theme is set through localStorage, which needs JavaScript
  test.beforeEach(({ javaScriptEnabled }) => {
    test.skip(!javaScriptEnabled, 'needs JavaScript');
  });

  for (const route of routes) {
    for (const theme of themes) {
      test(`${route} has no violations in ${theme}`, async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
        await page.goto(route);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});
