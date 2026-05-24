# M03 — Sistema de Tags e Filtros

## Ações
| Ação | Detalhe |
|------|--------|
| 2.1 | Implementar tabela `tags` + relacionamento Many-to-Many com posts — Schema do DB consistente (Drizzle/Prisma) |
| 2.2 | Criar componentes UI para adicionar/remover tags de um post — Checkbox ou seleção por categoria na página de criar/editar |
| 2.3 | Implementar filtros em lista de posts — filtrar por tag selecionada(s), página `/posts` com dropdown e resultado filtrado |

## Compilação e Teste Mínimo
```bash
# Compilar sistema de tags + filtros
npm run dev
echo "Verificar: marcar tag 'Código' → apenas posts marcados aparecem na lista"
```
---
