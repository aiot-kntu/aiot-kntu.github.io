# The Intelligence of Things Lab website

Astro + React + Tailwind CSS, with shadcn/ui components and a shared Zinc theme.

**Site editors:** see the [English content guide](docs/content-guide.en.md). All displayed content is managed through Markdown and JSON files in `src/content`; editing page components is unnecessary.

Use Node.js 22.13 or newer and pnpm 11.

```sh
pnpm install
pnpm dev
pnpm check
pnpm check:publications
pnpm check:transitions
pnpm check:hardware
pnpm build
pnpm preview
```

- `src/content/members/`: people and their profiles
- `src/content/research/`: research topics, studies, related publications
- `src/content/courses/`: courses and optional descriptions
- `src/content/publications/`: publication records; citations are generated automatically
- `src/content/updates/`: news, shown both on the home page and in the archive
- `src/content/settings/`: identity, navigation, page copy, buttons, labels, groups, hardware content
- `public/images/`: images referenced by the content
- `src/components/ui/`: locally owned shadcn/ui Button, Card and Separator components
- `src/styles/global.css`: semantic light/dark Zinc tokens

Content collections validate Markdown fields during development and builds. `pnpm check:content` also validates relationships, group/status IDs and local image paths. Smaller `order` values appear first. Use `draft: true` to hide a Markdown record. Use `featured: true` on publications and news to show them on the home page. Counts and year filters are calculated from the content.

Every push to `main` runs these checks and deploys the site to GitHub Pages.
