# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Development (requires .env — copy from .env.example first)
npm run dev                  # starts dev server on PORT from .env
npm run nuxt:prepare         # generate Nuxt type stubs

# Build & preview
npm run build                # outputs to .output/ (not dist)
npm run preview

# Linting & formatting
npm run lint
npm run lint:fix
npm run format               # Prettier over all files

# Prisma
npm run prisma:generate      # generate Prisma client
npm run prisma:migrate       # run dev migrations
npm run prisma:seed
npm run prisma:studio

# Docker
docker compose up --build                          # development
docker compose -f docker-compose.prod.yml up --build  # production
```

## Environment

Copy `.env.example` to `.env`. Required variables: `DATABASE_URL`, `NUXT_PUBLIC_APP_NAME`. Optional: `PORT` (default 3000), `NODE_ENV` (default development).

`DATABASE_URL` must be the Supabase direct connection URI (not the pooler/pgBouncer URL) so Prisma can run migrations and queries without a separate `DIRECT_URL`.

Validation is in `config/env.ts` (Joi). Nuxt fails at startup/build if a required variable is missing.

## Architecture

### Nuxt 4 full-stack with Nitro

- `app/` — frontend (Vue 3, Pinia, TanStack Query, Axios)
- `server/` — backend Nitro API handlers (Prisma + Supabase PostgreSQL)
- `prisma/` — schema, migrations, seed

### Routing

Routes are **not** file-system-based. They are defined manually in `app/router.options.ts`. Each route points to a view inside `app/presentation/<feature>/view/index.vue`. Middleware lives in `app/middleware/`.

### Presentation modules

Each feature lives in `app/presentation/<feature>/` with the sub-folders: `components/`, `composables/`, `interfaces/`, `services/`, `stores/`, `view/`. Global shared pieces go in `app/presentation/shared/` (components, composables, interfaces).

### HTTP client (frontend)

`app/plugins/api-client.ts` creates an Axios instance via `app/infrastructure/http/axios/create-axios-client.ts` and provides it globally as `$apiClient`. Interceptors add a request ID, default headers, optional bearer token from the `access_token` cookie, response-error normalization, and dev logging.

Consume the client in composables via `useApiClient()` (`app/presentation/shared/composables/useApiClient.ts`). Wrap API calls with TanStack Query composables following the pattern in `app/presentation/landing/composables/useHealthcheckQuery.ts` — query keys are centralized in `app/constants/query-keys.ts`.

### Theme system

A critical inline script in `nuxt.config.ts` sets `dark`/`light` class on `<html>` before first paint (no flash). Runtime persistence is handled by `app/infrastructure/theme/` and toggled through `app/plugins/theme-mode.client.ts`.

### Server-side conventions

- API routes: `server/api/<resource>/index.<method>.ts` (Nitro file-based routing)
- Prisma singleton: `server/database/prisma.ts`
- Business logic: `server/services/`
- Data access: `server/repositories/`
- Validation: `server/validators/`
- Swagger UI at `GET /api/docs`, OpenAPI JSON at `GET /api/openapi.json`, healthcheck at `GET /api/healthcheck`

### Path aliases (nuxt.config.ts)

| Alias | Path |
|---|---|
| `@presentation` | `app/presentation` |
| `@shared` | `app/shared` |
| `@interfaces` | `app/shared/interfaces` |
| `@types` | `app/types` |
| `@utils` | `app/utils` |
| `@constants` | `app/constants` |
| `@services` | `app/services` |

### Pre-commit hook

Husky runs `lint-staged` on commit, which formats staged files with Prettier. No conventional-commit rules are enforced.
