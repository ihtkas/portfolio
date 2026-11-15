import { getContainerRenderer as mdxRenderer } from '@astrojs/mdx/container-renderer';
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { getCollection, render } from 'astro:content';
import { feedHtml, lastModified } from '../lib/agents';
import { publishedPosts } from '../lib/posts';
import { site } from '../../site.config';

// Full-text RSS: every post rendered to HTML, sanitised, with absolute links.
export async function GET(context: APIContext) {
  const base = context.site ?? site.siteUrl;
  const posts = publishedPosts(await getCollection('posts'), { includeDrafts: false });
  const container = await AstroContainer.create({
    renderers: await loadRenderers([mdxRenderer()]),
  });
  const items = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post);
      const link = `/writing/${post.id}/`;
      return {
        title: post.data.title,
        description: post.data.dek,
        pubDate: post.data.date,
        link,
        categories: post.data.tags,
        content: feedHtml(await container.renderToString(Content), new URL(link, base)),
      };
    }),
  );
  const self = new URL('/rss.xml', base).href;
  const built = lastModified(posts);
  return rss({
    title: site.name,
    description: site.description,
    site: base,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: [
      '<language>en</language>',
      `<atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
      ...(built ? [`<lastBuildDate>${built.toUTCString()}</lastBuildDate>`] : []),
    ].join(''),
    items,
  });
}
