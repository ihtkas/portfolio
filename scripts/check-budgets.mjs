// Per-page size budgets: gzipped JS and CSS that each built HTML page loads.
// Usage: node scripts/check-budgets.mjs [distDir]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const KB = 1024;
// otherJs was 5 KB; raised to 6 KB for Astro prefetch (about 0.75 KB), which makes navigation instant.
const limits = { homeJs: 8 * KB, otherJs: 6 * KB, css: 20 * KB };

const dist = process.argv[2] ?? 'dist';

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

const gz = (text) => gzipSync(text).length;

/** Resolve a URL from a page to a file in dist; null for external URLs. */
function localFile(url, pageRoute) {
  if (/^(https?:)?\/\//.test(url)) return null;
  const clean = url.split(/[?#]/)[0];
  const abs = clean.startsWith('/') ? clean : posix.join(pageRoute, clean);
  return join(dist, abs);
}

function attr(tag, name) {
  return new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag)?.[1];
}

function measure(file) {
  const html = readFileSync(file, 'utf8');
  const rel = relative(dist, file).split(sep).join('/');
  const route = '/' + rel.replace(/index\.html$/, '');
  const pageDir = route.endsWith('/') ? route : posix.dirname(route) + '/';
  let js = 0;
  let css = 0;

  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const [, attrs, body] = m;
    const type = attr(attrs, 'type');
    if (type && !/^(module|text\/javascript)$/i.test(type)) continue; // JSON-LD etc.
    const src = attr(attrs, 'src');
    if (src) {
      const path = localFile(src, pageDir);
      if (path) js += gz(readFileSync(path));
    } else if (body.trim()) {
      js += gz(body);
    }
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!/\brel\s*=\s*["']?stylesheet/i.test(m[0])) continue;
    const href = attr(m[0], 'href');
    const path = href && localFile(href, pageDir);
    if (path) css += gz(readFileSync(path));
  }
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (m[1].trim()) css += gz(m[1]);
  }
  return { route, js, css };
}

const rows = htmlFiles(dist)
  .map(measure)
  .sort((a, b) => a.route.localeCompare(b.route));

const fmt = (n) => (n / KB).toFixed(2).padStart(7) + ' KB';
let failed = false;
const width = Math.max(...rows.map((r) => r.route.length), 5);
console.log(
  `${'page'.padEnd(width)}  ${'JS (gzip)'.padStart(10)}  ${'CSS (gzip)'.padStart(10)}  status`,
);
for (const r of rows) {
  const jsLimit = r.route === '/' ? limits.homeJs : limits.otherJs;
  const problems = [];
  if (r.js > jsLimit) problems.push(`JS over ${jsLimit / KB} KB`);
  if (r.css > limits.css) problems.push(`CSS over ${limits.css / KB} KB`);
  if (problems.length) failed = true;
  console.log(
    `${r.route.padEnd(width)}  ${fmt(r.js)}  ${fmt(r.css)}  ${problems.length ? 'FAIL: ' + problems.join(', ') : 'ok'}`,
  );
}
console.log(
  `limits: home JS ${limits.homeJs / KB} KB, other JS ${limits.otherJs / KB} KB, CSS ${limits.css / KB} KB per page`,
);
if (failed) {
  console.error('Budget exceeded.');
  process.exit(1);
}
