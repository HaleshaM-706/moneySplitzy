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

From the repository root, build with the repository as the Docker context and
`apps/api/Dockerfile` as the Dockerfile:

```bash
docker build -f apps/api/Dockerfile -t money-split-api .
```

The API depends on workspace packages and the root `pnpm-lock.yaml`, so do not
use `apps/api` as the build context.
# API (NestJS)

This folder will contain the NestJS backend application. Implement modules: auth, users, groups, expenses, settlements, notifications.

Run (once implemented):

```bash
cd apps/api
npm install
npm run start:dev
```
