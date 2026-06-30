# Static Blog

Modern technology blog with Next.js App Router + SQLite + Tailwind + TanStack Query, statically exported via GitHub Actions.

## 🚀 Getting Started

```bash
npm install
make dev
make build
make test
make lint
make seed
```

Open `http://localhost:3000`.

Deploys to GitHub Pages through `.github/workflows/build-and-deploy.yml`.

---

## 📚 Features

- Server-first Next.js 16 App Router
- SQLite + Drizzle ORM with committed local database
- Static export (`output: 'export'`)
- Tailwind CSS v4 with dark/light CSS custom properties
- Client-side search
- Tag filtering on homepage
- Infinite scroll on homepage
- RSS/Atom feeds
- Sitemap
- Newsletter subscription page
- Optimized images (WebP + responsive srcset + blur placeholder)
- Plausible/Umami privacy analytics with DNT respect
- Giscus comments
- Table of contents and reading time on post pages

---

## 🛠️ Tech Stack

- Next.js 16 (App Router, Static Export)
- TypeScript
- Tailwind CSS v4
- SQLite + Drizzle ORM
- TanStack Query
- Vitest
- Playwright
- GitHub Actions

## 📦 Project Structure

```
├── app/
│   ├── page.tsx
│   ├── page-client.tsx
│   ├── layout.tsx
│   ├── header.tsx
│   ├── providers.tsx
│   ├── globals.css
│   ├── analytics.tsx
│   ├── search/
│   ├── posts/
│   └── components/
├── lib/
├── db/
├── scripts/
├── cli/
├── hooks/
├── public/data/
├── out/
├── __tests__/
└── e2e/
```

## 📄 License

MIT © Admorelli