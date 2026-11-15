import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { routes } from './routes';

// dist/_headers is what Cloudflare serves. `astro preview` ignores it, so these tests read it and
// add its headers to the HTML responses themselves.
const headers = readFileSync('dist/_headers', 'utf8');
const allBlock = /^\/\*\n((?:[ \t]+.+\n?)+)/m.exec(headers)?.[1] ?? '';
const header = (name: string) =>
  new RegExp(`^\\s+${name}:\\s*(.+)$`, 'im').exec(allBlock)?.[1]?.trim() ?? '';
const csp = header('Content-Security-Policy');
const cspReportOnly = header('Content-Security-Policy-Report-Only');
const scriptSrc = /(?:^|;)\s*script-src([^;]*)/.exec(csp)?.[1]?.trim().split(/\s+/) ?? [];

const htmlFiles = (readdirSync('dist', { recursive: true }) as string[]).filter((f) =>
  f.endsWith('.html'),
);

test.describe('security headers', () => {
  test('the /* block has a CSP with filled hashes and no Cache-Control', () => {
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain('inline-script-hashes');
    expect(csp).not.toContain("'unsafe-inline' 'sha256"); // scripts never fall back to unsafe-inline
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(cspReportOnly).toContain("require-trusted-types-for 'script'");
    expect(allBlock).not.toMatch(/cache-control/i);
  });

  test('every inline script in dist is covered by a CSP hash', () => {
    let checked = 0;
    for (const file of htmlFiles) {
      const html = readFileSync(join('dist', file), 'utf8');
      for (const [, attrs = '', body = ''] of html.matchAll(
        /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
      )) {
        if (/\bsrc\s*=/.test(attrs) || /type\s*=\s*["']?application\/ld\+json/i.test(attrs)) {
          continue;
        }
        const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`;
        expect(scriptSrc, `${file}: inline script ${body.slice(0, 60)}`).toContain(hash);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

test.describe('pages under the CSP', () => {
  test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, 'needs JavaScript');

  test.beforeEach(async ({ page }) => {
    // `upgrade-insecure-requests` would send the local http:// preview to https://, so it is left
    // out here. Everything else is the policy as deployed.
    const policy = csp.replace(/;\s*upgrade-insecure-requests/, '');
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() !== 'document') return route.continue();
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          'content-security-policy': policy,
          'content-security-policy-report-only': cspReportOnly,
        },
      });
    });
    await page.addInitScript(() => {
      const seen: string[] = [];
      (window as unknown as { cspViolations: string[] }).cspViolations = seen;
      document.addEventListener('securitypolicyviolation', (e) =>
        seen.push(`${e.disposition} ${e.effectiveDirective} ${e.blockedURI}`),
      );
    });
  });

  for (const route of routes) {
    test(`${route} runs its scripts with no violations`, async ({ page }) => {
      const messages: string[] = [];
      page.on('console', (m) => {
        if (/content security policy|trusted type/i.test(m.text())) messages.push(m.text());
      });
      await page.goto(route);
      // The inline head script adds the `js` class; a blocked script would leave it off.
      await expect(page.locator('html')).toHaveClass(/\bjs\b/);
      await page.waitForLoadState('networkidle');
      const violations = await page.evaluate(
        () => (window as unknown as { cspViolations: string[] }).cspViolations,
      );
      expect(violations).toEqual([]);
      expect(messages).toEqual([]);
    });
  }

  test('prefetch still works', async ({ page }) => {
    const prefetched = page.waitForRequest((r) => new URL(r.url()).pathname === '/projects/');
    await page.goto('/writing/');
    await page.locator('header a[href="/projects/"]').first().hover();
    await prefetched;
  });
});
