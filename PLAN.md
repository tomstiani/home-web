# tomstiani.com — Build Plan

## Hero Copy
**Tomstiani**
"I like to tinker, sometimes I write about it."

---

## Tech Stack

| | |
|---|---|
| Framework | Astro |
| Styling | Tailwind CSS v4 |
| Content | MDX via Astro Content Collections |
| Language | TypeScript |
| Font | Geist Sans + Geist Mono via `@fontsource/geist` |
| Deploy | Vercel |

---

## Design Tokens

```css
--color-bg:       #09090b
--color-surface:  #0f1210
--color-border:   rgba(74, 222, 128, 0.08)
--color-text:     #e4e4e7
--color-muted:    #71717a
--color-accent:   #4ade80
```

Green (`#4ade80`) appears **only** as: border tints, hover states, tag pills, status dot on ongoing projects. Never as a fill or background.

---

## File Structure

```
home-website/
├── src/
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── ProjectCard.astro
│   │   └── ProseWrapper.astro
│   ├── content/
│   │   ├── config.ts
│   │   └── projects/
│   │       └── example-project.mdx
│   ├── layouts/
│   │   ├── Base.astro
│   │   └── Project.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── projects/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   └── contact.astro
│   └── styles/
│       └── global.css
├── public/
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

---

## Content Schema

```ts
// src/content/config.ts
{
  title:        string
  description:  string
  date:         Date
  cover?:       string        // path relative to public/
  tags:         string[]      // e.g. ['electronics', 'homelab', '3d-printing']
  status:       'completed' | 'ongoing'
  featured?:    boolean       // pulls onto homepage if true
}
```

---

## Pages

### `/` — Home
- Full-viewport hero: name large, one-liner below
- Green accent used subtly in the hero (e.g. decorative element or name highlight)
- Featured projects section: 2–3 `ProjectCard` components pulled via `featured: true`

### `/projects` — Listing
- Chronological list of all case studies
- Each `ProjectCard` shows: cover image (if present), title, description, date, tags, status dot

### `/projects/[slug]` — Case Study
- Cover image full-width at top (if present)
- Metadata bar: date, tags, status
- MDX prose body wrapped in `ProseWrapper.astro`
- Code blocks styled with Geist Mono

### `/contact` — Contact
- Short paragraph of copy
- Styled `mailto:` button/link
- Footer has placeholder slots ready for socials (to be filled in later)

---

## Build Order

1. Scaffold: `npm create astro@latest` with TypeScript
2. Add integrations: `@astrojs/tailwind`, `@astrojs/mdx`
3. Install fonts: `@fontsource-variable/geist`, `@fontsource-variable/geist-mono`
4. `global.css` — tokens, Geist import, base resets, prose styles
5. `Base.astro` — HTML shell, `<head>` meta, Nav, Footer
6. `Nav.astro` + `Footer.astro`
7. `src/content/config.ts` — Content Collection schema
8. `index.astro` — hero + featured projects
9. `projects/index.astro` — full listing
10. `projects/[slug].astro` + `Project.astro` layout
11. `contact.astro`
12. `example-project.mdx` — sample content to validate the full pipeline

---

## Decisions Log

- Contact is a `mailto:` link only — no form, no backend
- No filtering on `/projects` for now (can add later)
- No dark mode toggle — dark only
- No CMS — MDX files with frontmatter only
- Footer social links: placeholder slots, user fills in later
- Fully static — zero client-side JS
