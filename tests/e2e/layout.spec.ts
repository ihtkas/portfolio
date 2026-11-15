import { expect, test } from '@playwright/test';
import { routes } from './routes';

const widths = [320, 390, 768, 1440];

test.describe('no horizontal page scroll', () => {
  for (const route of routes) {
    for (const width of widths) {
      test(`${route} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);

        // html and body clip overflow-x, which hides sideways scroll from the check
        // above, so also require every text-bearing element to fit inside the viewport and its own box.
        const clipped = await page.evaluate(() => {
          const limit = document.documentElement.clientWidth + 1;
          const out: string[] = [];
          // content inside an intentional horizontal scroller (the slideshow strip) is fine
          const inScroller = (el: Element) => {
            for (let p = el.parentElement; p; p = p.parentElement) {
              const x = getComputedStyle(p).overflowX;
              if (x === 'auto' || x === 'scroll') return true;
            }
            return false;
          };
          for (const el of document.querySelectorAll('main *, header *, footer *')) {
            if (el.closest('pre, svg, [aria-hidden="true"], .sr') || inScroller(el)) continue;
            if (!el.textContent?.trim() || el.children.length > 0) continue;
            const r = el.getBoundingClientRect();
            // either the box leaves the viewport, or its text spills out of its own box
            const spills = el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1;
            if ((r.width > 0 && r.right > limit) || spills) {
              out.push(`${el.tagName.toLowerCase()}.${el.className} right=${Math.round(r.right)}`);
            }
          }
          return out;
        });
        expect(clipped).toEqual([]);
      });
    }
  }
});
