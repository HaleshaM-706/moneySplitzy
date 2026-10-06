FROM node:20
WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@8.8.0 --activate

COPY . .

RUN pnpm install --filter @money-split/api... --filter . --frozen-lockfile
RUN pnpm --filter @money-split/api exec prisma generate
RUN pnpm --filter @money-split/shared build && pnpm --filter @money-split/api build

WORKDIR /usr/src/app/apps/api
EXPOSE 3000
CMD ["node","dist/main.js"]
