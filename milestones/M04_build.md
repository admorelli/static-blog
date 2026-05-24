# M04 — Pipeline de Build e Geração Estática via GitHub Actions

## Ações
| Ação | Detalhe |
|------|--------|
| 3.1 | Criar workflow `.github/workflows/build-and-deploy.yml` — YAML com `on: push`, executa build + deploy |
| 3.2 | Script de build (Node.js) que lê SQLite, gera HTML estático para cada post — Script `build.ts/tsx` ou similar |
| 3.3 | Configurar GitHub Pages como destino do deploy — PAGES site enabled no repositório |

## Compilação e Teste Mínimo
```bash
# Compilar pipeline de build estático
npm run build:static
echo "Verificar: gerar HTML em pasta 'public' ou '_next/static'"
```
---
