---
title: "CLI Tool Review — Why We Built It and What It Actually Does"
description: "A review of the blog's CLI: creating posts from markdown, managing tags, uploading images, and organizing series."
date: "2026-06-20"
tags: [devlog, cli, tooling]
---

The blog ships with a TypeScript-based CLI under `cli/`. You run it as `npm run blog` or `npx tsx cli/index.ts`. This post walks through every command group and why it exists.

---

## Why a CLI (Instead of a CMS)

Top reasons:
* **No server-side runtime** — static export means no web UI for creating posts. A CLI is the only path for authors to write content.
* **Git-native workflow** — posts are markdown + frontmatter, stored in a single JSON database, and committed to the repo.
* **Automation-friendly** — CI can run `blog generate-static-data` before deploy, or an author can script dozens of posts.

---

## Command Groups

### Posts

```
blog posts list
blog posts create
blog posts create-from-markdown ./my-post.md
blog posts update <id> --title "..."
blog posts delete <id>
```

`create-from-markdown` is the workhorse. It accepts a Markdown file with a frontmatter block:

```markdown
---
title: "My Post"
tags: [devlog, cli]
slug: my-post
---

Hello world.
```

It parses frontmatter with `gray-matter`, converts markdown to HTML with `marked`, and inserts the row via Drizzle ORM.

`create` prompts interactively with `inquirer`. Good for quick posts without opening a text editor first.

### Tags

```
blog tags list
blog tags create "typescript"
blog tags delete "deprecated"
blog tags tag-post <tag> <post-id>
blog tags untag-post <tag> <post-id>
```

Tags are normalized (lowercased, trimmed). Duplicating a tag name returns the existing row rather than creating a new one.

### Images

```
blog images add ./hero.png --post my-slug
```

This is the image pipeline entry point. It:
1. Copies the file to `/posts/<slug>/img/...`
2. Generates responsive WebP variants through Sharp
3. Inserts the markdown embed into the post’s HTML (replacing `![alt](path)`)

### Series

```
blog series list
blog series create "Getting Started"
blog series add "Getting Started" my-slug --order 1
blog series reorder "Getting Started" --order 2 my-slug
```

Posts can belong to an ordered series. The detail page shows previous/next links automatically.

### Newsletter

```
blog newsletter list
blog newsletter add user@example.com
blog newsletter remove user@example.com
```

The subscriber list lives in SQLite. Export/import is a future enhancement.

### Static Generation + Build

```
blog generate-static-data
blog generate-feed
blog generate-sitemap
theme-switch-light
```

These commands prepare the site for static export. `generate-static-data` writes the JSON indexes in `public/data/`.

---

## Error Handling

The CLI uses a custom `CliError` class. Most commands:
* validate inputs up front
* exit with code 1 and a clear message on failure
* print a formatted table or formatted description on success

The `posts delete` flow even regresses to “dry-run” by default; you pass `--force` to actually remove.

---

## How We Test It

End-to-end tests live in `e2e/`. They shell out the CLI and assert exit codes + database state. That gave us confidence when we refactored `create-from-markdown` to use `gray-matter` — the E2E tests caught a regression on missing frontmatter immediately.

---

## Favorite Command

```
blog posts create-from-markdown ./posts/how-we-got-image-optimization.md
```

Write a markdown file, one command, post is live. That flow is the backbone of this very post you’re reading.
