// Builds a throwaway copy of the repo with no posts, no projects and `featured: []`, then asserts the
// designed empty states render. Run: node scripts/check-empty.mjs
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const skip = new Set([
  'node_modules',
  'dist',
  '.git',
  '.astro',
  '.superpowers',
  'test-results',
  'playwright-report',
  '.lighthouseci',
]);
const tmp = mkdtempSync(join(tmpdir(), 'portfolio-empty-'));
let failed = false;

try {
  cpSync(root, tmp, {
    recursive: true,
    filter: (src) => !skip.has(src.slice(root.length + 1).split('/')[0]),
  });
  symlinkSync(join(root, 'node_modules'), join(tmp, 'node_modules'));
  for (const dir of ['posts', 'projects']) {
    const path = join(tmp, 'src/content', dir);
    for (const f of readdirSync(path)) rmSync(join(path, f), { recursive: true });
  }
  const configPath = join(tmp, 'site.config.ts');
  const config = readFileSync(configPath, 'utf8');
  const emptied = config.replace(/featured:\s*\[[\s\S]*?\n {2}\],/, 'featured: [],');
  if (emptied === config) throw new Error('could not empty `featured` in site.config.ts');
  writeFileSync(configPath, emptied);

  const build = spawnSync('pnpm', ['astro', 'build'], { cwd: tmp, stdio: 'inherit' });
  if (build.status !== 0) throw new Error('astro build failed with empty content');

  const html = (p) => readFileSync(join(tmp, 'dist', p), 'utf8');
  const expect = (ok, what) => {
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
    if (!ok) failed = true;
  };
  const hasFilter = (s) => /class="[^"]*\bfilter\b/.test(s);
  const writing = html('writing/index.html');
  const projects = html('projects/index.html');
  const home = html('index.html');
  expect(writing.includes('No posts yet.'), '/writing/ shows the empty message');
  expect(!hasFilter(writing), '/writing/ hides the filter');
  expect(projects.includes('No projects yet.'), '/projects/ shows the empty message');
  expect(!hasFilter(projects), '/projects/ hides the filter');
  expect(home.includes('No posts yet.'), 'home Writing section shows the empty message');
  expect(!/class="[^"]*\breel\b/.test(home), 'home omits the slideshow');
  expect(existsSync(join(tmp, 'dist/resume/index.html')), 'resume still builds');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
