# Static Blog

Um blog de tecnologia moderno, profissional e pessoal, com modo de desenvolvimento via CLI (TUI), persistência SQLite simples, SSG via GitHub Actions, UI moderna com tema escuro e tags de filtro.

## 🧪 E2E Analytics Config

O teste `e2e/analytics.test.ts` requer variáveis de analytics e está pulado temporariamente até a configuração ser documentada.

Variáveis necessárias (Plausible/Umami):
- `NEXT_PUBLIC_ANALYTICS_PROVIDER`
- `NEXT_PUBLIC_ANALYTICS_SITE_ID`
- `NEXT_PUBLIC_ANALYTICS_SCRIPT`

Adicione esses valores em `.env` ou no ambiente de deploy, ajuste `app/analytics.tsx` conforme o provedor e reative `test.skip(...)` no arquivo `e2e/analytics.test.ts`.

## 🚀 Getting Started

The project includes a full unit-test suite (Vitest) and end-to-end tests (Playwright) that verify the homepage, posts list, and post detail pages load correctly.

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/admorelli/static-blog.git
cd static-blog
npm install
```

### Development

Most common tasks are now available via the top-level `Makefile`. For example:

```bash
make dev      # start the dev server (runs `npm run dev`)
make build    # build production files (`npm run build`)
make test     # run both unit and e2e tests (`npm run test:unit && npm run test:e2e`)
make lint     # run eslint
make seed     # seed sample data into SQLite
make drizzle-push # push Drizzle schema changes to SQLite
```

You can also still use the npm scripts directly:

```bash
npm run dev
npm run test:unit
npm run test:e2e
npm run build
npm run lint
npm run seed
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📚 Features

- **Modern UI**: Built with Next.js 16 App Router and Tailwind CSS v4, featuring a dark/light theme toggle with CSS custom properties
- **SQLite Persistence**: File-based SQLite with Drizzle ORM for blog posts and metadata
- **SSG Pipeline**: GitHub Actions workflow generates static HTML and deploys to GitHub Pages
- **CLI Management**: TypeScript registry-based CLI with grouped subcommands (posts, tags, images, series, newsletter)
- **Tag Filtering**: Toggleable pill tags on homepage with URL-synced filter state
- **Search**: Client-side search page (`/search`) plus homepage search filter across post titles and content
- **Infinite Scroll**: 10-post batches loaded on scroll respecting current search/filter
- **RSS/Atom Feeds**: Auto-generated during build
- **Sitemap**: Auto-generated during build
- **Newsletter**: Subscription page + CLI commands to manage subscribers
- **Image Pipeline**: WebP + responsive srcset + blur placeholder, slug-based storage
- **Privacy Analytics**: Plausible/Umami support with DNT respect and env-based configuration
- **Comments**: Giscus integration via GitHub Discussions
- **Reading Time + TOC**: Estimated reading time and scroll-spy table of contents on post pages
- **Responsive Design**: Mobile-first, accessible design

## 🛠️ Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, Static Export)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [SQLite](https://www.sqlite.org/) + [Drizzle ORM](https://orm.drizzle.team/)
- [TanStack Query](https://tanstack.com/query/latest) (data fetching/caching)
- [Vitest](https://vitest.dev/) (unit tests)
- [Playwright](https://playwright.dev/) (e2e tests)
- [GitHub Actions](https://github.com/features/actions)

## 📦 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page (server component)
│   ├── page-client.tsx    # Home page client (search, tags, infinite scroll)
│   ├── layout.tsx         # Root layout + providers
│   ├── header.tsx         # Navigation header with theme toggle
│   ├── providers.tsx      # React Query + Theme providers
│   ├── globals.css        # Tailwind v4 + CSS custom properties
│   ├── newsl
│   │   ├── page.tsx       # Newsletter page (server)
│   │   └── newsletter-form.tsx # Newsletter form component
│   ├── analytics.tsx      # Privacy analytics loader (Plausible/Umami)
│   ├── search/
│   │   ├── page.tsx       # Search page (server)
│   │   └── page-client.tsx # Search client (client-side filtering of posts-index.json)
│   ├── posts/
│   │   ├── page.tsx       # Posts list (SSG)
│   │   └── [slug]/
│   │       └── page.tsx   # Post detail (SSG)
│   ├── post/[slug]/       # Legacy post route (kept for compatibility)
│   ├── series/
│   │   ├── page.tsx       # Series list
│   │   └── [slug]/
│   │       └── page.tsx   # Series detail (SSG)
│   └── components/        # Shared client components
│       ├── GiscusComments.tsx
│       ├── SkeletonLoaders.tsx
│       └── TableOfContents.tsx
├── lib/
│   ├── posts.ts           # Posts CRUD + queries
│   ├── tags.ts            # Tags queries + pagination
│   └── static-posts-generated.ts # Auto-generated static data
├── db/
│   ├── db.ts              # Drizzle SQLite connection
│   └── schema.ts          # Posts, tags, post_tags tables
├── scripts/
│   ├── generate-static-data.ts  # Generates JSON + TS module for SSG
│   ├── generate-feed.ts         # Generates RSS/Atom feeds
│   └── generate-sitemap.js      # Sitemap generation via next-sitemap
├── cli/
│   ├── index.ts             # Entrypoint: `npm run blog` or `npx tsx cli/index.ts`
│   ├── commands/            # Subcommands grouped by domain
│   │   ├── posts/
│   │   ├── tags/
│   │   ├── images/
│   │   ├── series/
│   │   └── newsletter/
│   └── utils/             # Shared CLI helpers
├── public/data/           # Generated JSON files (posts-index, tags, post-tags)
├── out/                   # Static export output
├── __tests__/             # Unit tests (Vitest)
├── e2e/                   # E2E tests (Playwright)
└── Makefile               # Common commands
```

## 📌 Milestones

- **M01 – Setup** – Scaffolded Next.js app with Tailwind, SQLite & Drizzle. ✨
- **M02 – CRUD** – Data layer (`lib/posts.ts`) and SQLite schema (`db/schema.ts`) are in place, API routes and posts list page implemented.
- **M03 – UI** – Home page with search, tag selector (toggable pills), infinite scroll (10-post batches). Tag list fetched from static JSON.
- **M04 – Post Detail** – Implemented `/posts/[slug]` page and `/post/[slug]` page with SSG via `generateStaticParams`.
- **M05 – CLI Tool** – Full Inquirer-based CLI for post/tag management, static generation, and build. (Web create page removed)
- **M06 – Pipeline** – CI workflow wired: lint → typecheck → test → build → deploy to GitHub Pages.
- **M07 – Testing** – 124+ unit tests passing + 17+ E2E tests covering homepage, posts, images, search, newsletter.
- **M08 – Theme & Accessibility** – CSS custom properties for light/dark themes, semantic colors, accessible tag pills.
- **M09 – Images** – Post-creation image optimization, slug-based storage (`/posts/<slug>/img/<id>/`), E2E verified `<picture>` rendering, optimizer removed from build.
- **M10 – Search** – Client-side `/search` page with header nav, filters `posts-index.json` by title/content, E2E coverage.
- **M11 – Newsletter** – Newsletter subscription page + CLI commands (list/add/remove).
- **M12 – CLI Hardening** – E2E tests for CLI commands + error handling improvements across posts/tags/images/series/newsletter.
- **M13 – Privacy Analytics** – Privacy-oriented analytics (Plausible/Umami) with DNT respect and env-based configuration.

## 📝 Roadmap

- [x] Markdown authoring + CLI
- [x] Homepage post previews
- [x] Image support + optimization pipeline
- [x] Database protection
- [x] Full-text search (FTS5) + UI
- [x] SEO (OG, Twitter Cards, JSON-LD)
- [x] CLI tool review + E2E hardening
- [x] Giscus comments
- [x] Reading time + TOC
- [x] Skeleton loaders + empty states
- [x] Post series / collections
- [x] Newsletter integration
- [x] Privacy-Friendly Analytics (Plausible/Umami)
- [ ] Mobile nav drawer (hamburger/drawer on `<lg`)
- [ ] Dependency audit & updates
- [ ] ESLint/code warning cleanup

## 🤝 Contributing

Before opening a PR or pushing to `master`, please:

1. Update `DEV_PLAN.md` to reflect the current task and its status.
2. Update the roadmap/table in `AGENTS.md` if relevant.
3. Run `make test` to ensure unit + E2E tests pass.
4. Run `make lint` and fix any new errors from your changes.
5. Open a PR against `master`. The CI will validate lint, tests, and build.

## 📄 License

MIT © Admorelli
