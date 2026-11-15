import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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
        github: z.url().optional(),
        demo: z.url().optional(),
        writeup: z.string().optional(),
      }),
      video: z.object({ youtubeId: z.string(), duration: z.string(), poster: image() }).optional(),
    }),
});

export const collections = { posts, projects };
