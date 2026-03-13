FROM node:22-alpine

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json

# Install deps (workspace)
RUN pnpm install --frozen-lockfile=false

# Copy source
COPY packages/shared packages/shared
COPY apps/api apps/api

EXPOSE 8787

# Dev-style start (no production hardening)
CMD ["pnpm", "-C", "apps/api", "dev"]
