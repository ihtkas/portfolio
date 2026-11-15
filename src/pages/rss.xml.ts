import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { publishedPosts } from '../lib/posts';
import { site } from '../../site.config';

export async function GET(context: APIContext) {
  const posts = publishedPosts(await getCollection('posts'), { includeDrafts: false });
  return rss({
    title: site.name,
    description: site.description,
    site: context.site ?? site.siteUrl,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.dek,
      pubDate: post.data.date,
      link: `/writing/${post.id}/`,
      categories: post.data.tags,
    })),
  });
}
