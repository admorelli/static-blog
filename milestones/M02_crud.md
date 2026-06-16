# M02 — Implementação do CRUD via SQLite no Dev Mode

## Ações
| Ação | Detalhe |
|------|--------|
| 1.1 | Criar tabela `posts` (e `tags`, se necessário) no SQLite — Schema consistente (Drizzle/Prisma) |
| 1.2 | Implementar operações SQL via API (CRUD) — Funções de DAO ou queries via Drizzle/Prisma |
| 1.3 | Criar componente UI para listar posts e criar novo post (form) — Páginas `/posts`, `/new-post` com validação do formulário |

## Compilação e Teste Mínimo
```bash
# Compilar CRUD básico
npm run dev
echo "Verificar: criar post via form → aparecer na lista após refresh"
```
---
