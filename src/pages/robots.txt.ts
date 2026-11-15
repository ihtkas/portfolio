import type { APIContext } from 'astro';
import { site } from '../../site.config';

// Every crawler is welcome, AI crawlers included (owner decision 2026-11-15). The Content-Signal line
// states it for search, AI answers (ai-input) and AI training: https://contentsignals.org
export function GET(context: APIContext) {
  const sitemap = new URL('/sitemap-index.xml', context.site ?? site.siteUrl).href;
  const body = [
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=yes',
    'Allow: /',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
