# React Quest — 1000 React Questions (Adaptive + Timed)

Monorepo:
- `apps/web`: React + Vite + TypeScript + Tailwind
- `apps/api`: Node (Express) + TypeScript + MongoDB (NoSQL)
- `packages/shared`: shared types

## Features
- 1000-question bank (generated + deterministic)
- Adaptive difficulty (rating-based) + topic revisit
- Timed questions (auto-submit on timeout)
- Auth (email/password + JWT)
- One-page workflow UI (no routing required)

## Quickstart (local)

## Run with Docker (dev-style)

This is **not productionized** yet — it runs the web+api in dev mode.

```bash
# From repo root
export JWT_SECRET='dev_change_me'
export ADMIN_EMAIL='pete@nexgenstemschool.com.au'
export ADMIN_BOOTSTRAP_KEY='dev_only_admin_key'
export FEEDBACK_EMAIL_ADDRESS='feedback@example.com'
export SMTP_URL='smtp://user:pass@mail.example.com:587'
export SMTP_FROM='Hooked on React <no-reply@example.com>'

docker compose up --build
```

Web: http://localhost:5173
API: http://localhost:8787/health
Mongo: localhost:27017

## Run locally (no Docker)

### 1) Start MongoDB
```bash
docker compose up -d mongo
```

### 2) Install deps
```bash
pnpm install
```

### 3) Configure env
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 4) Run
```bash
pnpm -C packages/shared build
pnpm -C apps/api dev
pnpm -C apps/web dev
```

Web: http://localhost:5173
API: http://localhost:8787/health

## Regenerate questions
```bash
pnpm -C apps/api run generate:questions
```

## Migrations

### Backfill Attempt.topic
If you have existing attempts from before topic-tracking:
```bash
pnpm -C apps/api run migrate:attempt-topics
```

## Notes
- Question bank is stored as JSON and served from the API; user sessions and attempts live in MongoDB.
- The adaptive logic is intentionally simple (ELO-ish). Improve it by tracking per-topic item response performance.
- The first admin account now requires both `ADMIN_EMAIL` and `ADMIN_BOOTSTRAP_KEY` during registration; matching the email alone is not enough.
- The feedback panel posts to the API and sends email to `FEEDBACK_EMAIL_ADDRESS` via `SMTP_URL`; set `SMTP_FROM` if your mail provider requires a specific sender.
