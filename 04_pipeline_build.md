# 🗺️ Milestone 04 — Pipeline de Build e Geração Estática via GitHub Actions

**Objetivo:** Automatar o processo de compilação do SQLite para páginas HTML estáticas e publicar no GitHub Pages.

| Tarefa | Detalhe | Entregável |
|--------|--------|----------|
| 3.1 | Criar workflow `.github/workflows/build-and-deploy.yml` | YAML configurado com `on: push`, executa build + deploy |
| 3.2 | Script de build (Node.js) que lê SQLite, gera HTML estático para cada post | Script `build.ts/tsx` ou similar |
| 3.3 | Configurar GitHub Pages como destino do deploy | Configurações no repositório do GitHub (PAGES site enabled) |

**Critério de aceitação:** Ao fazer push com novos posts no SQLite, o workflow executa e gera HTML no `_next/static` ou pasta `public`, publica no GitHub Pages. Navegação via URL funciona.
