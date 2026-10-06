# API (NestJS)

Scaffolded as `@money-split/api`.

Quick start:

```bash
pnpm install
pnpm dev:api
```

DB commands (root):

```bash
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

## Docker deployment

Build with the repository root as the Docker context and `apps/api/Dockerfile` as
the Dockerfile path. The API depends on workspace packages and the root pnpm
lockfile, so the Docker context must not be limited to `apps/api`.
# API (NestJS)

This folder will contain the NestJS backend application. Implement modules: auth, users, groups, expenses, settlements, notifications.

Run (once implemented):

```bash
cd apps/api
npm install
npm run start:dev
```
