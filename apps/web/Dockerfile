FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile=false

COPY packages/shared packages/shared
COPY apps/web apps/web

EXPOSE 5173

# Dev-style start (not production)
CMD ["pnpm", "-C", "apps/web", "dev", "--host", "0.0.0.0"]
