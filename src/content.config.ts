import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    stack: z.array(z.string()).min(1),
    screenshot: z.string().optional(),
    video: z.string().optional(), // a looping recording of a website project, shown on the 3D monitor
    accent: z.tuple([hex, hex]).default(['#6b5cff', '#ff6ad5']),
    links: z.object({ live: z.string().url().optional(), repo: z.string().url().optional() }).default({}),
    featured: z.boolean().default(false),
    order: z.number().default(99),
  }),
});

export const collections = { projects };
