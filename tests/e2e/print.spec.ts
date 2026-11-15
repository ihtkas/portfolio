import { expect, test } from '@playwright/test';

test.describe('resume download (print to PDF)', () => {
  test('the button opens the print dialog with a resume file name', async ({ page }, info) => {
    test.skip(info.project.use.javaScriptEnabled === false, 'needs JavaScript');
    await page.addInitScript(() => {
      (window as unknown as { printedTitle?: string }).printedTitle = '';
      window.print = () => {
        (window as unknown as { printedTitle?: string }).printedTitle = document.title;
      };
    });
    await page.goto('/resume/');
    const button = page.getByRole('button', { name: 'Download PDF' });
    await expect(button).toBeVisible();
    await button.click();
    const printedTitle = await page.evaluate(
      () => (window as unknown as { printedTitle?: string }).printedTitle,
    );
    expect(printedTitle).toMatch(/Resume$/);
  });

  test('without JavaScript the button is hidden', async ({ page }, info) => {
    test.skip(info.project.use.javaScriptEnabled !== false, 'no-JS project only');
    await page.goto('/resume/');
    await expect(page.locator('[data-print]')).toBeHidden();
  });

  for (const theme of ['dark', 'light']) {
    test(`print styles give a plain light document (${theme} theme)`, async ({ page }) => {
      await page.addInitScript((t) => {
        try {
          localStorage.setItem('theme', t);
        } catch {
          /* storage blocked */
        }
      }, theme);
      await page.goto('/resume/');
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator('header.bar')).toBeHidden();
      await expect(page.locator('footer.foot')).toBeHidden();
      await expect(page.locator('.btns')).toBeHidden();
      const styles = await page.evaluate(() => {
        const body = getComputedStyle(document.body);
        const title = getComputedStyle(document.querySelector('.title') as Element);
        return {
          bg: body.backgroundColor,
          titleFill: title.getPropertyValue('-webkit-text-fill-color'),
        };
      });
      expect(styles.bg).toBe('rgb(255, 255, 255)');
      expect(styles.titleFill).not.toBe('rgba(0, 0, 0, 0)');
    });
  }
});
