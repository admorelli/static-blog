# Static Blog

Um blog de tecnologia moderno, profissional e pessoal, com modo de desenvolvimento via CLI (TUI), persistência SQLite simples, SSG via GitHub Actions, UI moderna com tema escuro e tags de filtro.

## 🚀 Getting Started

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

Most common tasks are now available via the top‑level `Makefile`. For example:

```bash
make device   # start the dev server (runs `npm run dev`)
make build    # build production files (`npm run build`)
make test     # run both unit and e2e tests (`npm run test:unit && npm run test:e2e`)
```

You can also still use the npm scripts directly:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📚 Features

- **Modern UI**: Built with Next.js 14 and Tailwind CSS, featuring a dark/light theme toggle
- **SQLite Persistence**: Simple file-based SQLite for blog posts and metadata
- **SSG Pipeline**: GitHub Actions workflow generates static HTML and deploys to GitHub Pages
- **CLI Development Mode**: TUI interface for managing posts via terminal commands
- **Tag Filtering**: Filter posts by tags with a modern dropdown UI
- **Responsive Design**: Mobile-first, accessible design using Radix UI primitives

## 🛠️ Tech Stack

- [Next.js 14](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [SQLite](https://www.sqlite.org/)
- [Radix UI](https://radix-ui.com/)
- [GitHub Actions](https://github.com/features/actions)

## 📝 Roadmap

- [ ] CLI TUI interface for post management
- [ ] Post editor with markdown preview
- [ ] RSS feed generation
- [ ] SEO optimization (Open Graph, Twitter Cards)
- [ ] Search functionality
- [ ] Comments system

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

MIT © Admorelli
