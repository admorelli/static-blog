# Static Blog

Um blog de tecnologia moderno, profissional e pessoal, com modo de desenvolvimento via CLI (TUI), persistência SQLite simples, SSG via GitHub Actions, UI moderna com tema escuro e tags de filtro.

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
```

You can also still use the npm scripts directly:

```bash
npm run dev
npm run test:unit
npm run test:e2e
npm run build
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📚 Features

- **Modern UI**: Built with Next.js 15 App Router and Tailwind CSS v4, featuring a dark/light theme toggle with CSS custom properties
- **SQLite Persistence**: File-based SQLite with Drizzle ORM for blog posts and metadata
- **SSG Pipeline**: GitHub Actions workflow generates static HTML and deploys to GitHub Pages
- **CLI Management**: Full Inquirer-based CLI for post/tag management, static generation, and build
- **Tag Filtering**: Toggleable pill tags on homepage with URL-synced filter state
- **Search**: Client-side search across post titles and content
- **Infinite Scroll**: 10-post batches loaded on scroll respecting current search/filter
- **RSS/Atom Feeds**: Auto-generated during build
- **Sitemap**: Auto-generated during build
- **Responsive Design**: Mobile-first, accessible design

## 🛠️ Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router, Static Export)
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
│   ├── posts/
│   │   ├── page.tsx       # Posts list (SSG)
│   │   └── [slug]/
│   │       └── page.tsx   # Post detail (SSG)
│   ├── post/[slug]/       # Legacy post route (kept for compatibility)
│   ├── providers.tsx      # React Query + Theme providers
│   ├── theme-provider.tsx # Dark/light theme context
│   ├── theme-toggle.tsx   # Theme toggle button
│   └── globals.css        # Tailwind v4 + CSS custom properties
├── lib/
│   ├── posts.ts           # Posts CRUD + queries
│   ├── tags.ts            # Tags queries + pagination
│   └── static-posts-generated.ts # Auto-generated static data
├── db/
│   ├── db.ts              # Drizzle SQLite connection
│   └── schema.ts          # Posts, tags, post_tags tables
├── scripts/
│   ├── generate-static-data.js  # Generates JSON + TS module for SSG
│   ├── generate-feed.js         # Generates RSS/Atom feeds
│   └── generate-sitemap.js      # Sitemap generation via next-sitemap
├── cli/
│   └── blog.js            # CLI for post/tag management
├── public/data/           # Generated JSON files (posts-index, tags, post-tags)
├── out/                   # Static export output
├── __tests__/             # Unit tests (Vitest)
├── e2e/                   # E2E tests (Playwright)
└── Makefile               # Common commands
```

## 📌 Milestones

- **M01 – Setup** – Scaffolded Next.js 13 app with Tailwind, shadcn/ui, SQLite & Drizzle. ✨
- **M02 – CRUD** – Data layer (`lib/posts.ts`) and SQLite schema (`db/schema.ts`) are in place, API routes and posts list page implemented.
- **M03 – UI** – Home page with search, tag selector (toggable pills), infinite scroll (10-post batches). Tag list fetched from static JSON.
- **M04 – Post Detail** – Implemented `/posts/[slug]` page and `/post/[slug]` page with SSG via `generateStaticParams`.
- **M05 – CLI Tool** – Full Inquirer-based CLI for post/tag management, static generation, and build. (Web create page removed)
- **M06 – Pipeline** – CI workflow wired: lint → typecheck → test → build → deploy to GitHub Pages.
- **M07 – Testing** – 80 unit tests passing (41 regression + 39 existing) + 3 E2E tests.
- **M08 – Theme & Accessibility** – CSS custom properties for light/dark themes, semantic colors, accessible tag pills.

## 📝 Roadmap

- [ ] Post editor with markdown preview (CLI-based)
- [ ] SEO optimization (Open Graph, Twitter Cards)
- [ ] Comments system
- [ ] Image optimization pipeline
- [ ] Full-text search (SQLite FTS5)

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

MIT © Admorelli