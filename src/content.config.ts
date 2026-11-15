import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const ordered = { order: z.number().default(99), draft: z.boolean().default(false) };
const optionalLink = z.string().refine(value => /^(https?:\/\/|\/(?!\/)|mailto:|#)/.test(value), 'Use an https://, /, #, or mailto: link');
const members = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/members' }),
  schema: z.object({
    ...ordered, name: z.string(), group: z.string(), role: z.string(),
    profile: optionalLink.optional(), image: z.string().optional(), topic: z.string().optional(),
    year: z.number().int().optional(), affiliation: z.string().optional(), eyebrow: z.string().optional(),
  }),
});
const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    ...ordered, title: z.string(), shortTitle: z.string(), area: z.string(), focus: z.string().optional(),
    studies: z.array(z.object({ title: z.string(), researcher: z.string(), date: z.string().optional(), code: optionalLink.optional() })).default([]),
    publicationIds: z.array(z.string()).default([]),
  }),
});
const courses = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/courses' }),
  schema: z.object({ ...ordered, title: z.string(), url: optionalLink.optional() }),
});
const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    ...ordered, title: z.string(), authors: z.array(z.string()).min(1), citationAuthors: z.string(),
    year: z.number().int(), status: z.string(), venue: z.string().optional(), doi: z.string().optional(),
    url: optionalLink.optional(), featured: z.boolean().default(false),
  }),
});
const updates = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/updates' }),
  schema: z.object({ title: z.string(), date: z.coerce.date(), link: optionalLink.optional(), featured: z.boolean().default(false), draft: z.boolean().default(false) }),
});
export const collections = { members, research, courses, publications, updates };
