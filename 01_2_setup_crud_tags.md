# 🗺️ Milestones 01–03 — Setup, CRUD e Tags

**Objetivo:** Configurar infraestrutura básica, implementar CRUD via SQLite no Dev Mode e adicionar sistema de tags.

## ⏱ Milestone 01 — Setup do Projeto e Infraestrutura Básica
| Tarefa | Detalhe | Entregável |
|--------|--------|----------|
| 0.1 | Iniciar repos (Git) | `package.json`, `.env.example`, estrutura de pastas |
| 0.2 | Configurar Next.js + Tailwind + shadcn/ui | UI básica funcional, tema dark/claro configurado |
| 0.3 | Instalar SQLite via Drizzle ORM ou Prisma | Cliente DB local pronto para consultas simples |

**Critério de aceitação:** Projeto rodável em `npm run dev`, com UI mostrando um post de exemplo (hardcoded). Teste manual: abrir projeto e ver título + conteúdo básico.

---

## ⏱ Milestone 02 — Implementação do CRUD via SQLite no Dev Mode
| Tarefa | Detalhe | Entregável |
|--------|--------|----------|
| 1.1 | Criar tabela `posts` (e `tags`, se necessário) no SQLite | Schema do DB consistente (Drizzle/Prisma) |
| 1.2 | Implementar operações SQL via API (CRUD) | Funções de DAO ou queries via Drizzle/Prisma |
| 1.3 | Criar componente UI para listar posts e criar novo post (form) | Páginas `/posts`, `/new-post` com validação do formulário |

**Critério de aceitação:** Usuário consegue: clicar em "Criar Post", preencher formulário, salvar — o post aparece na lista após refresh. Persistência correta no SQLite.

---

## ⏱ Milestone 03 — Sistema de Tags e Filtros de Tag
| Tarefa | Detalhe | Entregável |
|--------|--------|----------|
| 2.1 | Implementar tabela `tags` + relacionamento Many-to-Many com posts | Schema do DB consistente (Drizzle/Prisma) |
| 2.2 | Criar componentes UI para adicionar/remover tags de um post | Checkbox ou seleção por categoria na página de criar/editar |
| 2.3 | Implementar filtros em lista de posts — filtrar por tag selecionada(s) | Página `/posts` com dropdown de tags e resultado filtrado |

**Critério de aceitação:** Ao marcar a tag "Código" no filtro, apenas posts marcados aparecem na lista. Adicionar/remover tags é funcional.
