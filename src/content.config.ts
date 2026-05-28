import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    cover: image().optional(),
    tags: z.array(z.string()),
    status: z.enum(['completed', 'ongoing']),
    featured: z.boolean().optional().default(false),
    github: z.string().url().optional(),
  }),
})

const thoughts = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/thoughts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional().default([]),
    featured: z.boolean().optional().default(false),
    published: z.boolean().optional().default(false),
  }),
})

export const collections = { projects, thoughts }
