# 🛠️ Notas Técnicas Adicionais

## Persistência SQLite e Build Pipeline
O SQLite deve estar localizado em um arquivo local (`db.sqlite`) dentro do repositório ou gerado durante build. Para CI/CD no GitHub Actions:
- **Opção A (DB fixo):** `db.sqlite` é commitado — garante consistência entre dev → build.
- **Opção B (Gerar DB no build):** Script cria SQLite temporário, insere posts via API do Dev Mode, fecha e lê para gerar HTML — evita commits de binários/lockfiles.

Recomendamos a **Opção A** para simplicidade e rastreamento. Se o projeto crescer, migrar para SQLite em memória ou PostgreSQL via container Docker no CI é viável.

## Regras de Código e Reuso (Req. #7)
- Componentes devem ser reutilizáveis (ex: `Card`, `TagSelect`, `Button`) — shadcn/ui facilita isso.
- Nomenclatura consistente: `PascalCase` para componentes, `camelCase` para utilitários, `SCREAMING_SNAKE_CASE` para constantes de DB/schema.
- Evitar duplicação de lógica de CRUD — encapsular em DAOs (Data Access Objects) ou serviços.
---
