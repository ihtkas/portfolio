// Fills the script hashes into the Content-Security-Policy in dist/_headers after the build.
//
// public/_headers holds the whole header policy, with the placeholder below where the hashes go.
// After `astro build`, this integration hashes every inline executable <script> in dist/**/*.html
// and writes them into dist/_headers. Adding or editing an inline script needs no manual step.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

export const HASHES_PLACEHOLDER = "'inline-script-hashes'";

// Cloudflare ignores _headers lines longer than 2,000 characters.
const MAX_LINE = 2000;

// Script types the browser runs, so CSP applies to them. JSON-LD and other data blocks never run.
const EXECUTABLE = /^(|module|speculationrules|(text|application)\/(java|ecma)script)$/i;

function attr(attrs: string, name: string): string | undefined {
  const m = new RegExp(
    `(?:^|\\s)${name}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+)))?`,
    'i',
  ).exec(attrs);
  if (!m) return undefined;
  return m[1] ?? m[2] ?? m[3] ?? '';
}

/** The bodies of the inline scripts in `html` that CSP must allow. */
export function inlineScripts(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = m[1] ?? '';
    const body = m[2] ?? '';
    if (attr(attrs, 'src') !== undefined) continue;
    if (!EXECUTABLE.test((attr(attrs, 'type') ?? '').trim())) continue;
    out.push(body);
  }
  return out;
}

/** The CSP source expression for a script body, for example `'sha256-…'`. */
export function scriptHash(body: string): string {
  return `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;
}

/** Sorted, unique hash sources for every inline script in the given pages. */
export function hashesFor(pages: string[]): string[] {
  return [...new Set(pages.flatMap((html) => inlineScripts(html).map(scriptHash)))].sort();
}

/** Replaces the placeholder in a _headers file. Throws if it is missing or a line gets too long. */
export function fillHeaders(headers: string, hashes: string[]): string {
  if (!headers.includes(HASHES_PLACEHOLDER)) {
    throw new Error(`_headers: no ${HASHES_PLACEHOLDER} placeholder in the CSP`);
  }
  const filled = headers.replaceAll(HASHES_PLACEHOLDER, hashes.join(' '));
  const long = filled.split('\n').find((line) => line.length > MAX_LINE);
  if (long)
    throw new Error(`_headers: a line is over ${MAX_LINE} characters: ${long.slice(0, 80)}…`);
  return filled;
}

export default function cspHeaders(): AstroIntegration {
  return {
    name: 'csp-headers',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = (await readdir(root, { recursive: true })).filter((f) => f.endsWith('.html'));
        const pages = await Promise.all(files.map((f) => readFile(join(root, f), 'utf8')));
        const hashes = hashesFor(pages);
        const path = join(root, '_headers');
        await writeFile(path, fillHeaders(await readFile(path, 'utf8'), hashes));
        logger.info(`${hashes.length} inline script hashes written to _headers`);
      },
    },
  };
}
