# API (NestJS)

Scaffolded as `@money-split/api`.

The API contract, including authentication requirements, request schemas, query
options, validation rules, and response shapes, is documented in
[`../../docs/api/openapi.yaml`](../../docs/api/openapi.yaml). When the API is
running, the controller-generated Swagger UI is available at `/docs`.

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
the root `Dockerfile`:

```bash
docker build -t money-split-api .
```

The API depends on workspace packages and the root `pnpm-lock.yaml`, so do not
use `apps/api` as the build context.

For Render, configure the Docker service with the repository root as its
**Root Directory** (leave it blank) and the root `Dockerfile` as its
**Dockerfile Path**. Do not set `apps/api` as the Root Directory: Render would
then omit the workspace lockfile and packages from the Docker build context.

Run the Docker build locally from the repository root to verify the context:

```bash
docker build -t money-split-api .
```
