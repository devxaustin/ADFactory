import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One markdown file per product. `stage` decides which station it sits on
// and how finished its card looks.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    stage: z.enum(['prototype', 'production', 'shipped']),
    type: z.enum(['software', 'art', 'music', 'school', 'other']),
    year: z.number().int(),
    // Production stage only: how far along it is, 0 to 100.
    progress: z.number().min(0).max(100).optional(),
    tags: z.array(z.string()).default([]),
    links: z
      .array(
        z.object({
          label: z.string(),
          // A full URL, or a path on this site starting with "/" (e.g. "/monkey-island/").
          href: z.string().refine((h) => h.startsWith('/') || /^https?:\/\//.test(h), 'Use a full URL or a path starting with /'),
        }),
      )
      .default([]),
    // Path inside /public, e.g. "/media/cover.jpg". Optional.
    image: z.string().optional(),
    // Which Projects category it sits under (a `key` in projectCategories in site.ts), e.g. "games".
    category: z.string().optional(),
    // Set to true to hide an entry without deleting it.
    hidden: z.boolean().default(false),
  }),
});

export const collections = { projects };
