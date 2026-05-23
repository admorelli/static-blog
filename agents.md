# 🤖 Agentes de Implementação — Blog Tech (Next.js + SQLite → GitHub Pages)

> **Objetivo:** Executar a implementação do blog estático em etapas sequenciais, com compilação e testes mínimos após cada passo.

---

## 📋 Pré-requisitos Gerais
- Ambiente Node.js 20+ instalado (`node -v` ≥ 20)
- Git configurado (`git config --global user.email/name`)
- GitHub Pages habilitado no repositório (Settings → Pages → Source: `gh-pages` branch)

---

## 🗺️ Sequência de Implementação — Passo a Passo

### **Passo 01 — Setup do Projeto e Infraestrutura Básica** *(M01)*
| Ação | Detalhe |
|------|--------|
| 0.1 | Iniciar repos (Git) | `git init`, `.gitignore` (`.next/`, `node_modules/`, `*.sqlite`, `db.sqlite*`) |
| 0.2 | Configurar Next.js + Tailwind + shadcn/ui | `npx create-next-app@latest . --app --tailwind --eslint --typescript`
| 0.3 | Instalar SQLite via Drizzle ORM ou Prisma | `npm i drizzle-orm better-sqlite3` |

**Compilação e Teste Mínimo:**
```bash
# Compilar UI básica (hardcoded)
npm run dev
# Verificar: abrir http://localhost:3000 → post de exemplo aparece
```
---

### **Passo 02 — Implementação do CRUD via SQLite no Dev Mode** *(M02)*
| Ação | Detalhe |
|------|--------|
| 1.1 | Criar tabela `posts` (e `tags`, se necessário) no SQLite | Schema consistente (Drizzle/Prisma) |
| 1.2 | Implementar operações SQL via API (CRUD) | Funções de DAO ou queries via Drizzle/Prisma |
| 1.3 | Criar componente UI para listar posts e criar novo post (form) | Páginas `/posts`, `/new-post` com validação do formulário |

**Compilação e Teste Mínimo:**
```bash
# Compilar CRUD básico
npm run dev
# Verificar: criar post via form → aparecer na lista após refresh
```
---

### **Passo 03 — Sistema de Tags e Filtros de Tag** *(M03)*
| Ação | Detalhe |
|------|--------|
| 2.1 | Implementar tabela `tags` + relacionamento Many-to-Many com posts | Schema do DB consistente (Drizzle/Prisma) |
| 2.2 | Criar componentes UI para adicionar/remover tags de um post | Checkbox ou seleção por categoria na página de criar/editar |
| 2.3 | Implementar filtros em lista de posts — filtrar por tag selecionada(s) | Página `/posts` com dropdown de tags e resultado filtrado |

**Compilação e Teste Mínimo:**
```bash
# Compilar sistema de tags + filtros
npm run dev
# Verificar: marcar tag "Código" → apenas posts marcados aparecem na lista
```
---

### **Passo 04 — Pipeline de Build e Geração Estática via GitHub Actions** *(M04)*
| Ação | Detalhe |
|------|--------|
| 3.1 | Criar workflow `.github/workflows/build-and-deploy.yml` | YAML configurado com `on: push`, executa build + deploy |
| 3.2 | Script de build (Node.js) que lê SQLite, gera HTML estático para cada post | Script `build.ts/tsx` ou similar |
| 3.3 | Configurar GitHub Pages como destino do deploy | Configurações no repositório do GitHub (PAGES site enabled) |

**Compilação e Teste Mínimo:**
```bash
# Compilar pipeline de build estático
npm run build:static
# Verificar: gerar HTML em pasta `public` ou `_next/static`
```
---

### **Passo 05 — UI Completa, Tema Dark/Light e Layout Responsivo** *(M05)*
| Ação | Detalhe |
|------|--------|
| 4.1 | Configurar tema dark por padrão (ou switch) + suporte light | `themeColor` ou `prefers-color-scheme` no Next.js App Router |
| 4.2 | Criar layouts de página (single post, listagem, home) | Componentes reutilizáveis com shadcn/ui |
| 4.3 | Ajustes visuais e microinterações | UX refinada (hover, transições suaves, tipografia) |

**Compilação e Teste Mínimo:**
```bash
# Compilar UI completa com tema dark/claro
npm run dev
# Verificar: alternar tema → layout responsivo em mobile/desktop
```
---

### **Passo 06 — Testes (Unitários + E2E)** *(M06)*
| Ação | Detalhe |
|------|--------|
| 5.1 | Configurar Vitest com Jest/Vitest para testes de utilitários (CRUD, parsing) | `vitest.config.ts`, testes unitários básicos |
| 5.2 | Criar testes E2E via Playwright para fluxos críticos: criar post → publicar → filtrar por tag | `playwright.config.ts`, testes no fluxo da UI |

**Compilação e Teste Mínimo:**
```bash
# Compilar testes unitários + E2E
npm run test:unit
npm run test:e2e
```
---

### **Passo 07 — Auditoria e Refatoração Periódica** *(M07)*
| Ação | Detalhe |
|------|--------|
| 6.1 | Criar checklist de auditoria (regras de reutilização, nomenclatura, arquitetura) | `docs/audit-checklist.md` |
| 6.2 | Revisões a cada ~2–3 sprints de implementação | Relatórios de auditoria + ações de remedição |

**Compilação e Teste Mínimo:**
```bash
# Compilar checklist de auditoria
npm run audit:checklist
```
---

## 🧪 Critérios de Aceitação por Passo
| Passo | Critério |
|------|--------|
| 01 | Projeto rodável em `npm run dev`, UI mostrando post de exemplo (hardcoded) |
| 02 | Usuário consegue criar post via form → aparece na lista após refresh |
| 03 | Filtro por tag funciona: posts marcados aparecem, não-marcados são ocultados |
| 04 | Workflow GitHub Actions executa build + deploy ao fazer push; HTML estático gerado |
| 05 | UI visualmente agradável em dark/claro; responsivo para mobile; navegação fluida |
| 06 | Cobertura mínima de 60–80% (segunda fase); nenhum teste quebrado na CI |
| 07 | Código limpo, sem duplicações significativas, fácil manutenção |

---

## 🛠️ Notas Técnicas Adicionais — Considerações Específicas do Projeto

### Persistência SQLite e Build Pipeline
O SQLite deve estar localizado em um arquivo local (`db.sqlite`) dentro do repositório ou gerado durante build. Para CI/CD no GitHub Actions:
- **Opção A (DB fixo):** `db.sqlite` é commitado — garante consistência entre dev → build.
- **Opção B (Gerar DB no build):** Script cria SQLite temporário, insere posts via API do Dev Mode, fecha e lê para gerar HTML — evita commits de binários/lockfiles.

Recomendamos a **Opção A** para simplicidade e rastreamento. Se o projeto crescer, migrar para SQLite em memória ou PostgreSQL via container Docker no CI é viável.

### Regras de Código e Reuso (Req. #7)
- Componentes devem ser reutilizáveis (ex: `Card`, `TagSelect`, `Button`) — shadcn/ui facilita isso.
- Nomenclatura consistente: `PascalCase` para componentes, `camelCase` para utilitários, `SCREAMING_SNAKE_CASE` para constantes de DB/schema.
- Evitar duplicação de lógica de CRUD — encapsular em DAOs (Data Access Objects) ou serviços.  

---

## 🔮 Evolução Futura — Possíveis Melhorias Pós-Implantação Inicial
- Modo de preview em tempo real do post ao criar/editar
- Integração com GitHub Issues para revisão e aprovação de posts antes do build
- Suporte a múltiplos idiomas (i18n) se necessário
- Métricas de visualização via integração simples (ex: Fathom/Umami)

---

**Conclusão:** Com este plano, o projeto segue uma abordagem incremental, permitindo validação rápida em cada fase enquanto mantém rigor nas regras de qualidade e reutilização. O resultado final é um blog técnico moderno, fácil de manutenção, e pronto para evolução contínua.
