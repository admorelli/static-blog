# M01 — Setup do Projeto e Infraestrutura Básica

## Pré-requisitos
- Ambiente Node.js 20+ (`node -v` ≥ 20)
- Git configurado (`git config --global user.email/name`)
- GitHub Pages habilitado no repositório (Settings → Pages → Source: `gh-pages` branch)

## Ações
| Ação | Detalhe |
|------|--------|
| 0.1 | Iniciar repos (Git) — `git init`, `.gitignore` (`.next/`, `node_modules/`, `*.sqlite`, `data.db*`) |
| 0.2 | Configurar Next.js + Tailwind + shadcn/ui — `npx create-next-app@latest . --app --tailwind --eslint --typescript` |
| 0.3 | Instalar SQLite via Drizzle ORM ou Prisma — `npm i drizzle-orm better-sqlite3` |

## Compilação e Teste Mínimo
```bash
# Compilar UI básica (hardcoded)
npm run dev
echo "Verificar: http://localhost:3000 → post de exemplo aparece"
```
---
