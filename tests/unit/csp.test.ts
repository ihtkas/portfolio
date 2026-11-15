import { describe, expect, it } from 'vitest';
import {
  HASHES_PLACEHOLDER,
  fillHeaders,
  hashesFor,
  inlineScripts,
  scriptHash,
} from '../../integrations/csp';

describe('inlineScripts', () => {
  it('keeps classic, module and speculation rules scripts', () => {
    const html =
      '<script>a()</script><script type="module">b()</script>' +
      '<script type="speculationrules">{}</script><script type="text/javascript">c()</script>';
    expect(inlineScripts(html)).toEqual(['a()', 'b()', '{}', 'c()']);
  });
  it('skips external scripts and data blocks such as JSON-LD', () => {
    const html =
      '<script type="module" src="/_astro/x.js"></script>' +
      '<script defer src=https://example.com/a.js></script>' +
      '<script type="application/ld+json">{"@type":"Person"}</script>';
    expect(inlineScripts(html)).toEqual([]);
  });
  it('keeps the body byte for byte, whitespace included', () => {
    expect(inlineScripts('<script>\n  x();\n</script>')).toEqual(['\n  x();\n']);
  });
});

describe('scriptHash', () => {
  it('is the base64 sha256 CSP source', () => {
    // echo -n 'alert(1)' | openssl dgst -sha256 -binary | base64
    expect(scriptHash('alert(1)')).toBe("'sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='");
  });
});

describe('hashesFor', () => {
  it('dedupes across pages and sorts', () => {
    const pages = ['<script>a()</script><script>b()</script>', '<script>a()</script>'];
    expect(hashesFor(pages)).toEqual([scriptHash('a()'), scriptHash('b()')].sort());
  });
});

describe('fillHeaders', () => {
  const headers = `/*\n  Content-Security-Policy: script-src 'self' ${HASHES_PLACEHOLDER}\n`;
  it('replaces the placeholder', () => {
    expect(fillHeaders(headers, ["'sha256-a'", "'sha256-b'"])).toContain(
      "script-src 'self' 'sha256-a' 'sha256-b'",
    );
  });
  it('fails without a placeholder', () => {
    expect(() => fillHeaders('/*\n  X-Frame-Options: DENY\n', [])).toThrow(/placeholder/);
  });
  it('fails when a line passes the Cloudflare limit', () => {
    expect(() => fillHeaders(headers, Array(60).fill("'sha256-" + 'x'.repeat(44) + "'"))).toThrow(
      /2000/,
    );
  });
});
