# tomstiani.com

Personal portfolio and project case studies. Built with Astro, Tailwind CSS v4, and MDX.

## Stack

- **[Astro](https://astro.build)** — static site generator
- **[Tailwind CSS v4](https://tailwindcss.com)** — utility-first styling
- **[MDX](https://mdxjs.com)** — project case studies with embedded components
- **Geist** — font (via `@fontsource-variable/geist`)
- **Vercel** — deployment

## Project structure

```
src/
├── assets/projects/     # Project images (optimized by Astro at build time)
├── components/          # Nav, Footer, ProjectCard, ProseWrapper
├── content/projects/    # MDX case studies
├── content.config.ts    # Content collection schema
├── layouts/             # Base.astro, Project.astro
├── pages/               # index, projects/[slug], contact
└── styles/global.css    # Design tokens, Tailwind, prose styles

public/
├── assets/favicons/     # favicon.svg, .ico, PNGs, webmanifest
└── fallback_og.png      # Fallback Open Graph image
```

## Adding a project

Create a new `.mdx` file in `src/content/projects/`:

```mdx
---
title: "Project title"
description: "One sentence description."
date: 2026-01-01
tags: ['electronics', 'homelab']
status: completed          # or: ongoing
featured: false            # true to show on homepage
cover: "../../assets/projects/my-project/cover.jpg"   # optional
github: "https://github.com/tomstiani/my-project"     # optional
---

import { Image } from 'astro:assets'
import photo from '../../assets/projects/my-project/photo.jpg'

Your writeup in MDX...

<Image src={photo} alt="Description" />
```

Images go in `src/assets/projects/<project-slug>/` and are automatically converted to WebP and optimized at build time.

## Commands

| Command | Action |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Start dev server at `localhost:4321` |
| `bun run build` | Build to `./dist/` |
| `bun run preview` | Preview production build locally |
