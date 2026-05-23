# 🏗️ Arquitetura Técnica — Blog Tech (Next.js + SQLite → GitHub Pages)

> **Versão:** 1.0 | **Data:** 2026-05-23

---

## 1. Visão Geral do Projeto

**Objetivo:** Criar um blog de tecnologia (profissional + interesses pessoais) com: modo de desenvolvimento via CLI, persistência SQLite simples, SSG via GitHub Actions, UI moderna com tema escuro e tags de filtro.

**Stack alvo:**
- Frontend/SSG: Next.js 14+ (App Router), React 19, TailwindCSS
- Dev mode CLI: TUI em terminal (react-terminal ou readline simples)
- Persistência dev: SQLite (single-file DB para simplicidade)
- CI/CD: GitHub Actions → parse SQLite → gerar páginas estáticas → commitar ao branch `gh-pages`
- UI: tema claro/escuro, design minimalista e acessível

---

## 2. Estrutura de Dados (SQLite)

### Tabela `posts`
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,          -- "2026-05-23-migracao-codigo-legado"
  title TEXT NOT NULL,
  body TEXT NOT NULL,                 -- Markdown puro
  tags TEXT,                         -- JSON array: ["C#", "Legacy", "Migração"]
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela `tags` (opcional)
```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL          -- "C#", "Legacy", etc.
);
```

> **Nota:** Para simplificar o CI/CD, a coluna `tags` como JSON é preferível (evita joins complexos no build). O filtro por tags será feito via parse do JSON na etapa de geração estática.  
> **Backup:** A cada mudança de DB, gerar um dump SQLite (`sqlite3 db.sqlite .dump > data.sql`) e versionar o arquivo `data.sql` no repo (ou manter apenas o `.sqlite` — ambos funcionam). Recomendo `.sql` para CI/CD mais fácil.  

---

## 3. Fluxo de Dados: Dev → Build → GitHub Pages

```
┌───────────────┐
│   DEV MODE   │  ← CLI (react-terminal) cria posts no SQLite
└───────┬───────┘
       │ sqlite3 data.db
       ▼
┌───────────────┐
│  CI/CD       │  ← GitHub Actions: parse DB → gerar slugs/titles/tags
└───────┬───────┘
       │ next.config.mjs (output: static pages)
       ▼
┌───────────────┐
│  gh-pages    │  ← branch de produção, acessível via GitHub Pages
└──────────────┘
```

---

## 4. Modo Dev (CLI) — Requisitos do Usuário

O usuário menciona: *"criar via ecrã novas postagens"* → interpreto como **TUI em terminal** (não web). Decisões:

| Opção | Vantagem | Desvantagem |
|------|---------|------------|
| `react-terminal` + componentes React | UI moderna, tags autocompletáveis, validação | Maior curva de setup, dependência extra |
| `readline`/`inquirer` puro (JS) | Simples, zero deps extras, fácil manutenção | UI mais crua, sem autocomplete nativo |

**Recomendação:** Iniciar com **`react-terminal`** (ou `ink`) — o usuário pode migrar para `readline` se preferir algo mais leve.  

---

## 5. Tema e UI

- TailwindCSS + CSS variables (`--theme-color`, `--bg-primary`, etc.)
- Dark mode via `[data-theme="dark"]` no `<html>` (persistido em localStorage)
- Tipografia: Inter (Google Fonts) — limpa, moderna, boa leitura técnica
- Layouts: Grid para posts, cards minimalistas, breadcrumbs, tags como badges coloridos por categoria (opcional)

---

## 6. CI/CD (GitHub Actions)

**Passos do workflow (`ci.yml`)**
1. Checkout repo → restaurar `data.db` ou `data.sql`
2. Executar script Node.js (`scripts/build-static.mjs`):
   - Parse SQLite/SQL dump
   - Gerar: `/posts/{slug}/index.html`, `/posts/{slug}/tags.json`, `/sitemap.xml`, `/feed.xml`
3. Commitar ao branch `gh-pages` (ou push direto se permitido)
4. Deploy automático via GitHub Pages

> **Nota:** Se usar `.sqlite` binário, o script deve usar `better-sqlite3`. Se usar `.sql`, pode ser parseado com `node:stream/web` + regex simples (evita deps).  

---

## 7. Regras de Desenvolvimento (Code Quality)

| Regra | Descrição |
|------|----------|
| **1** | Nomes de arquivos: `kebab-case`, sem espaços, prefixo por tipo (`post-`, `component-`, `lib-`) |
| **2** | Componentes React: 1 arquivo por componente (`.tsx`), props explícitas no topo do arquivo |
| **3** | TailwindCSS: preferir classes utilitárias; evitar `style={{}}` inline quando possível |
| **4** | Testes: Vitest (unitários) + Playwright (E2E). Cobertura mínima 80% para lógica de build e CLI. |
| **5** | CI/CD: lint (`eslint`), typecheck (`tsc --noEmit`), test, só então commitar ao `gh-pages`. |
| **6** | Auditorias periódicas (a cada 3 meses): revisão manual de duplicação, complexidade ciclomática, e refatoração de componentes genéricos. |

---

## 8. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|------|--------|----------|
| **CI/CD falha ao parsear SQLite** | Bloqueia deploy | Usar `.sql` (dump) em vez de `.sqlite` binário — mais fácil de debug e versionamento |
| **CLI TUI instável** | Perde posts não salvos | Implementar auto-save a cada 5s; mostrar indicador visual de "salvando..." |
| **Tags duplicadas no JSON** | Filtros quebrados | Normalizar tags ao criar (trim, lowercase, remover espaços extras) — validar no CLI |
| **Tema escuro com contraste baixo** | Acessibilidade comprometida | Usar paleta predefinida (ex: TailwindCSS `slate-900` → `slate-50`) e testar em simulação de daltonismo |

---

## 9. Entregas Esperadas ao Final do Projeto

| Artefato | Descrição |
|---------|----------|
| `data.db` / `data.sql` | Persistência SQLite (versões versionadas no repo) |
| `/posts/{slug}/index.html` | Páginas estáticas geradas via CI/CD |
| `/sitemap.xml`, `/feed.xml` | SEO e RSS para leitores de blog |
| CLI TUI funcional | Criar, listar, deletar posts via terminal |
| UI moderna + tema escuro | Layout responsivo, acessível, com filtros por tags |
| Testes Vitest + Playwright | Cobertura ≥80% para lógica crítica |

---

## 10. Próximos Passos Imediatos (Milestone 0)

1. Criar repo Git (`tech-blog-cli`) com estrutura inicial
2. Instalar dependências: `next`, `better-sqlite3` (ou parser SQL), `react-terminal`/`ink`
3. Escrever README.md com instruções de instalação e uso básico da CLI
4. Commitar Milestone 0 e abrir PR para revisão do plano atualizado
