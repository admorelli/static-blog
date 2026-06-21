# Architecture Documentation

This document describes the high-level architecture and design decisions for the `static_blog` project.

## Overview

`static_blog` is a personal technology blog built with **Next.js 16 App Router** and **SQLite** via **Drizzle ORM**. The site is statically exported and deployed to GitHub Pages using a GitHub Actions CI pipeline.

## Core Principles

1. **Static-first** – Content is generated at build time and served as plain HTML/CSS/JS.
2. **Local-first** – SQLite database lives in the repo, making CI deterministic and local development simple.
3. **CLI-driven authoring** – Blog posts are created and managed through a TypeScript CLI (`npm run blog`).
4. **Minimal runtime dependencies** – No external CMS, no server-side rendering at runtime.

## Data Flow

1. **Authoring** – The user runs CLI commands to create/update posts, tags, images, and subscribers.
2. **Static Generation** – `scripts/generate-static-data.ts` reads the SQLite DB and emits JSON + TS modules consumed by the app during `next build`.
3. **Rendering** – Next.js SSG pages consume the generated data and output static HTML into the `out/` directory.
4. **Deployment** – GitHub Actions builds the site, then pushes `out/` to GitHub Pages.

## Technologies

- **Next.js 16** – App Router, static export (`output: 'export'`)
- **TypeScript** – Strict typing across the stack
- **Tailwind CSS v4** – CSS-first configuration with `@theme inline`
- **SQLite + Drizzle ORM** – Lightweight relational storage
- **TanStack Query** – Client-side caching and background refetch for infinite scroll
- **Vitest + Playwright** – Unit and end-to-end test coverage
- **GitHub Actions** – CI/CD pipeline

## Directory Roles

| Path | Role |
|------|------|
| `app/` | Next.js App Router pages and client components |
| `lib/` | Data access layer and generated static data |
| `db/` | Drizzle schema and database connection |
| `scripts/` | Build-time data generation (posts, feeds, sitemap) |
| `cli/` | Authoring interface (posts, tags, images, series, newsletter) |
| `public/data/` | Generated JSON consumed by SSG pages |
| `__tests__/` | Vitest unit tests (80+) |
| `e2e/` | Playwright E2E tests (15+) |

## Key Design Decisions

- **SQLite in repo** – Deterministic CI builds; no external database required.
- **Static export** – Zero hosting cost, simple CDN deployment via GitHub Pages.
- **Client-side search** – The `/search` page filters `posts-index.json` at runtime for instant results.
- **CLI over web UI for authoring** – Keeps the runtime surface area small and the developer workflow fast.
