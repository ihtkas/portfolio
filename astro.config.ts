import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { site } from './site.config';

export default defineConfig({
  site: process.env['SITE_URL'] ?? site.siteUrl,
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
  // Load pages before the click: the nav links as soon as the page is idle (see Header.astro),
  // every other link on hover, focus or touch start.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
    },
  },
});
