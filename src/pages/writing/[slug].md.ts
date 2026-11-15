import type { APIContext, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { postMarkdown } from '../../lib/agents';
import { publishedPosts, type Post } from '../../lib/posts';
import { site } from '../../../site.config';

// A Markdown copy of each post, for agents and readers that prefer plain text. The HTML page links
// it with <link rel="alternate" type="text/markdown">.
export const getStaticPaths = (async () => {
  const posts = publishedPosts(await getCollection('posts'));
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

export function GET(context: APIContext) {
  const { post } = context.props as { post: Post };
  const url = new URL(`/writing/${post.id}/`, context.site ?? site.siteUrl).href;
  return new Response(postMarkdown(post, url), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
