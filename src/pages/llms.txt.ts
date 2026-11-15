import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { llmsTxt } from '../lib/agents';
import { publishedPosts } from '../lib/posts';
import { site } from '../../site.config';

// https://llmstxt.org: a Markdown index of the site for AI agents, built from the same data.
export async function GET(context: APIContext) {
  const posts = publishedPosts(await getCollection('posts'), { includeDrafts: false });
  const projects = await getCollection('projects');
  const body = llmsTxt(site, posts, projects, context.site ?? site.siteUrl);
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
