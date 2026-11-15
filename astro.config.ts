import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import cspHeaders from './integrations/csp';
import { site } from './site.config';

export default defineConfig({
  site: process.env['SITE_URL'] ?? site.siteUrl,
  output: 'static',
  trailingSlash: 'always',
  // cspHeaders must stay last: it hashes the inline scripts in the finished HTML.
  integrations: [mdx(), sitemap(), cspHeaders()],
  // Load pages before the click: the nav links as soon as the page is idle (see Header.astro),
  // every other link on hover, focus or touch start.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // The whole stylesheet is small (about 8 KB gzipped), so inlining it removes the one render-blocking
  // request and lets the browser find the fonts a round trip sooner.
  build: { inlineStylesheets: 'always' },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
    },
  },
});
