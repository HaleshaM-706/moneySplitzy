FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps ./apps
COPY packages ./packages

RUN pnpm install --filter @money-split/api... --filter . --frozen-lockfile

RUN pnpm --filter @money-split/api exec prisma generate

RUN pnpm --filter @money-split/shared build && \
    pnpm --filter @money-split/api build

CMD ["pnpm", "--filter", "@money-split/api", "start"]