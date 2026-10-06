# Money Split (monorepo)

Monorepo for Money Split application (React Native frontend, NestJS backend, Prisma/Postgres, Redis).

See docs/ for architecture and API contracts.

Requirements: install `pnpm` (preferred) or use Yarn workspaces. This repo is configured for `pnpm`.

Setup and run (macOS / Linux):

```bash
# install pnpm (if not installed)
npm install -g pnpm

# install workspace dependencies
pnpm install

# start Postgres + Redis
docker compose up -d

# run API in dev mode
pnpm dev:api

# run mobile (Expo) in dev mode
pnpm dev:mobile

# run typecheck across workspace
pnpm typecheck

# prisma commands (from repo root)
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

See individual package README files in `apps/` and `packages/` for build and run instructions
