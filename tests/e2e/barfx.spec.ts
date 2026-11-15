import { expect, test } from '@playwright/test';

test.beforeEach(({ javaScriptEnabled }) => {
  test.skip(!javaScriptEnabled, 'needs JavaScript');
});

test.describe('header instruments', () => {
  test('ambient canvas animates at desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const ambient = page.locator('canvas.bfx-ambient');
    await expect(ambient).toHaveCount(1);
    await expect(page.locator('.bar.has-fx')).toHaveCount(1);
    const frame = (): Promise<string> => ambient.evaluate((c: HTMLCanvasElement) => c.toDataURL());
    const a = await frame();
    await page.waitForTimeout(300);
    const b = await frame();
    expect(a).not.toBe(b);
  });

  test('ambient canvas is hidden on phones', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    await expect(page.locator('canvas.bfx-ambient')).toBeHidden();
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('ambient stays blank and the underline jumps', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      const ambient = page.locator('canvas.bfx-ambient');
      await expect(page.locator('.bar.has-fx')).toHaveCount(1);
      const blank = await ambient.evaluate((c: HTMLCanvasElement) => {
        const ctx = c.getContext('2d');
        if (!ctx) return false;
        return ctx.getImageData(0, 0, c.width, c.height).data.every((v) => v === 0);
      });
      expect(blank).toBe(true);

      const link = page.locator('header nav a', { hasText: 'Projects' });
      await link.hover();
      const spring = page.locator('canvas.bfx-spring');
      const box = await link.boundingBox();
      const bar = await page.locator('.bar').boundingBox();
      if (!box || !bar) throw new Error('missing geometry');
      const cx = Math.round(box.x + box.width / 2 - bar.x);
      // the snapped underline is drawn under the hovered link on the next frame
      await expect
        .poll(() =>
          spring.evaluate((c: HTMLCanvasElement, x: number) => {
            const ctx = c.getContext('2d');
            const dpr = c.width / c.clientWidth;
            if (!ctx) return 0;
            const px = ctx.getImageData(Math.round(x * dpr), 0, 1, c.height).data;
            let n = 0;
            for (let i = 3; i < px.length; i += 4) if ((px[i] ?? 0) > 0) n++;
            return n;
          }, cx),
        )
        .toBeGreaterThan(0);
    });
  });
});
