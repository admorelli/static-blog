# M06 — Testes (Unitários + E2E)

## Ações
| Ação | Detalhe |
|------|--------|
| 5.1 | Configurar Vitest com Jest/Vitest para testes de utilitários (CRUD, parsing) — `vitest.config.ts`, testes unitários básicos |
| 5.2 | Criar testes E2E via Playwright para fluxos críticos: criar post → publicar → filtrar por tag — `playwright.config.ts`, testes no fluxo da UI |

## Compilação e Teste Mínimo
```bash
# Compilar testes unitários + E2E
npm run test:unit
echo "Verificar"
npm run test:e2e
```
---
