import { readdirSync, readFileSync } from 'node:fs';

function published(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .filter((f) => !/^draft:\s*true$/m.test(readFileSync(`${dir}/${f}`, 'utf8')))
    .map((f) => f.replace(/\.mdx?$/, ''));
}

/** Every HTML route the site builds, derived from the content folders. */
export const routes: string[] = [
  '/',
  '/writing/',
  ...published('src/content/posts').map((slug) => `/writing/${slug}/`),
  '/projects/',
  '/resume/',
  '/404.html',
];
