# Website content guide

You can update the website's content without editing Astro, React, or TypeScript files. All displayed information comes from Markdown and JSON files in `src/content`. You can edit Markdown files directly on GitHub.

## Where to edit each type of content

| Content | Location |
| --- | --- |
| Members, director, students, and alumni | `src/content/members/*.md` |
| Research topics, student projects, and related publications | `src/content/research/*.md` |
| Courses and descriptions | `src/content/courses/*.md` |
| Publications and publication statuses | `src/content/publications/*.md` |
| News on the home page and in the archive | `src/content/updates/*.md` |
| Site identity, home page copy, page headings, navigation, and footer links | `src/content/settings/site.json` |
| Member group names and order | `src/content/settings/groups.json` |
| Button text, labels, filters, and messages | `src/content/settings/ui.json` |
| Hardware names, photos, specifications, and figure text | `src/content/settings/hardware.json` |
| Images | `public/images/` |

Home page lists use these same sources. For example, a new research topic automatically appears on the Research page, in its topic index, and on the home page. Member, publication, and course counts, as well as publication year filters, are calculated from the content.

## Shared Markdown conventions

A file's name is its ID: `edge-computing.md` has the ID `edge-computing`. Use lowercase English letters and hyphens. Avoid renaming an ID after linking to it.

The section between the two `---` markers is YAML frontmatter containing structured fields. After the closing marker, you can write paragraphs, headings, lists, links, and images using Markdown. Multiline YAML and JSON-style arrays within YAML are supported.

- A smaller `order` value appears earlier. This field is optional for members, research topics, courses, and publications. News is sorted by date instead.
- Set `draft: true` to hide an item temporarily. The default is `false`.
- To remove an item, delete its Markdown file. Before removing a publication, also remove its ID from any research topics that reference it.
- For an image stored at `public/images/example.webp`, use `/images/example.webp` in the `image` field. Do not include `public` in the URL.
- Quote text containing `:`. Use spaces for YAML indentation.

## Add a research topic

Create a file such as `src/content/research/edge-computing.md`:

```md
---
title: "Edge computing"
shortTitle: "Edge computing"
area: "Internet of Things"
order: 5
studies:
  - title: "Energy-aware scheduling"
    researcher: "Researcher name"
    date: "October 2026"
    code: "https://github.com/your-organization/project"
publicationIds: []
---
Write the research description here. You can include several paragraphs and links.
```

Each topic displays its heading, description, and text links. Adding the Markdown file is enough; no image, SVG, or page template change is required. Research topics do not use `figure`, `image`, or `imageAlt` fields. The topic index, section numbers, and home page links are generated automatically.

In `publicationIds`, use the publication file's name without `.md`:

```yaml
publicationIds:
  - khanmirza2022wildminnie
```

The optional `focus` field is a short description shown on the home page and the Research page. Put the full description after the closing `---`. Both `studies` and `publicationIds` are optional and can be omitted or left empty; empty sections are hidden.

## Add a member or member group

Example file: `src/content/members/researcher-name.md`.

```md
---
name: "Researcher name"
group: "msc"
role: "MSc researcher"
order: 7
profile: "https://example.org/profile"
image: "/images/people/researcher.webp"
topic: "Distributed systems"
---
An optional short introduction.
```

The fields `profile`, `image`, `topic`, `affiliation`, `eyebrow`, and `year` are optional. Without a photo, the site displays the person's initials. For alumni, use `group: alumni` and include the graduation year.

The two Shokri entries with similar spellings are intentionally kept separate because the original lab's [People page](https://iot-kntu.github.io/people/) lists both. Confirm the correct identity and profile before merging or removing either entry.

To add a group, add an object with `id`, `title`, and `label` to `settings/groups.json`. Use that same `id` in members' `group` fields. The array determines the order of groups. Empty groups are hidden.

## Add a publication

Example file: `src/content/publications/example2026.md`.

```md
---
title: "Paper title"
authors: ["First Author", "Second Author"]
citationAuthors: "Author, First and Author, Second"
year: 2026
status: "published"
venue: "Journal name"
doi: "10.xxxx/example"
order: 1
featured: true
---
```

The site displays `authors` and uses `citationAuthors` for BibTeX exports. Set `featured: true` to include a publication on the home page; there is no fixed limit on featured publications.

The fields `venue`, `doi`, and `url` are optional. If provided, `url` links directly to the publication and takes precedence over the DOI link. Enter the DOI without the `https://doi.org/` prefix. Remove the example `doi` field if the publication has no DOI.

The current statuses are `published`, `submitted`, and `preparing`. To add another status, add its ID, display label, and BibTeX note to the `publications.statuses` array in `settings/ui.json`. The filters are generated from this array. BibTeX is generated automatically from each publication record; no separate bibliography file is needed.

## Add a course

Create a Markdown file in `src/content/courses/`:

```md
---
title: "Course name"
order: 5
url: "https://example.org/course"
---
Write the course description, syllabus, or resource links here.
```

The `url` field is optional. Courses without a link are still displayed.

## Add news

Create a Markdown file in `src/content/updates/`:

```md
---
title: "News title"
date: "2026-10-27"
featured: true
---
Write the full news item here using Markdown.
```

News appears in reverse chronological order, with the newest item first. All published news appears on the News page. Items with `featured: true` also appear on the home page. The optional `link` field makes the news title a link. Use `draft: true` to hide an item from both pages.

## Edit text, branding, and navigation

Edit the JSON files in `settings`, preserving valid quotes and commas. The `site.json` file contains page copy, home page actions, navigation items, and footer links. Keep placeholders such as `{name}`, `{title}`, and `{count}` in `ui.json`; the application replaces them with the appropriate values.

Configure the logo under `branding` in `site.json`. The `animated` mode uses the vector paths in `settings/logo-paths.json`. To use your own logo file, set `mode` to `image`, place the file in `public`, and configure `image`, `alt`, `width`, and `height`. The `favicon` setting is independent of the main logo.

Use `hardware.json` to update equipment specifications, photos, headings, and button text. The IDs `thingy`, `dk`, and `dongle` connect equipment to the existing technical illustration. You can add content for another device to the array, but drawing a different device in the illustration requires a design change. Changes to `nameplate` or the illustration description are included in the generated SVG when you run the build.

## Check and publish changes

Use Node.js 22.13 or newer and pnpm 11. Install dependencies once with `pnpm install`, then use:

```sh
pnpm dev                 # Local development preview
pnpm check               # Validate content and TypeScript
pnpm check:publications  # Validate generated BibTeX
pnpm check:transitions   # Check navigation progress state
pnpm check:hardware      # Audit hardware artwork geometry
pnpm build               # Generate the production site in dist
pnpm preview             # Preview the production build
```

The checks validate Markdown fields, group and status IDs, research-to-publication references, and local image paths. Errors identify the affected file or field. Content changes appear online after the site is rebuilt and the new output is deployed.

In the GitHub repository's **Settings → Pages**, select **GitHub Actions** as the publishing source. Pushes to the repository's default branch run the workflow, check and build the site, and deploy `dist` to GitHub Pages. You can also run the workflow manually from the **Actions** tab on the default branch. Pull requests targeting `main` or `master` run checks and builds; deployment happens after changes reach the default branch.

The paths in the table at the start of this guide are the site's content sources. Historical content and collections from the previous site have been removed from the project.
