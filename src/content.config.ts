import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const httpUrl = z.url().refine((u) => /^https?:\/\//i.test(u), 'must be an http(s) URL');
const httpOrSitePath = z
  .string()
  .refine(
    (u) => u.startsWith('/') || /^https?:\/\//i.test(u),
    'must be an http(s) URL or a site-relative path starting with /',
  );

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    dek: z.string(),
    kind: z.enum(['engineering', 'life']),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
    updated: z.coerce.date().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      section: z.string(),
      kind: z.enum(['oss', 'work']),
      period: z.string(),
      summary: z.string(),
      stack: z.array(z.string()),
      order: z.number(),
      links: z.object({
        github: httpUrl.optional(),
        demo: httpUrl.optional(),
        writeup: httpOrSitePath.optional(),
      }),
      video: z
        .object({
          youtubeId: z.string().regex(/^[\w-]{11}$/, 'must be an 11 character YouTube id'),
          duration: z.string(),
          poster: image(),
        })
        .optional(),
    }),
});

export const collections = { posts, projects };
