# Copilot instructions for elim-system

## Project snapshot

This repo is a Nuxt 4 full-stack TypeScript app built on Nitro, Prisma, and PostgreSQL. Frontend feature modules live under `app/presentation/<feature>`; backend handlers live under `server/api`, and business logic is separated into `server/services`, `server/repositories`, `server/validators`, and `server/dto`. The app is organized around modular presentation features and a manual route registry in `app/router.options.ts`.

## Required setup

- Copy `.env.example` to `.env` before running the app.
- Required runtime env values are enforced by `config/env.ts` with Joi. Missing or invalid values fail startup.
- `DATABASE_URL` must be the direct Postgres connection URL (not a PgBouncer/pooler URL). `JWT_SECRET` is required and should be at least 32 characters.
- `npm run dev` runs Prisma generation, database setup, and the Nuxt dev server. It expects the database to be reachable at `DATABASE_URL`.

## Build, lint, and validation

```bash
npm install
Copy-Item .env.example .env   # PowerShell
# or: cp .env.example .env

npm run dev
npm run build
npm run preview

npm run lint
npm run lint:fix
npm run format

npm run nuxt:prepare
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio

docker compose up --build
```

There is no automated test runner configured in this repository. There is no `npm test` script and no single-test command to run today. If tests are introduced later, prefer targeted runs such as `npx vitest run path/to/file.spec.ts` or the project’s equivalent instead of invoking the full suite.

## Architecture

- `app/` contains the Vue 3 frontend; feature domains live under `app/presentation/<feature>/` with `components/`, `composables/`, `interfaces/`, `services/`, `stores/`, and `view/`.
- `app/router.options.ts` is the source of truth for routes; routes are not filesystem-driven.
- Shared UI and composables live in `app/presentation/shared/`, and global theme/assets live in `app/assets/`.
- `app/plugins/api-client.ts` creates the Axios client, with interceptors for request IDs, auth token propagation, standardized error handling, and dev logging. Reuse the shared `useApiClient()` pattern from the presentation layer rather than creating ad hoc clients.
- `server/api/` hosts Nitro API handlers (`index.get.ts`, `index.post.ts`, etc.). Keep business logic in `server/services/`, persistence in `server/repositories/`, validation in `server/validators/`, and DTOs in `server/dto/<resource>/`.
- `server/database/prisma.ts` owns the Prisma singleton; Prisma schema and migrations live under `prisma/`.
- `nuxt.config.ts` validates env early and sets runtime config plus the critical theme script that applies light/dark classes before first paint.
- Swagger and OpenAPI endpoints are exposed under `/api/docs` and `/api/openapi.json`; the healthcheck lives at `/api/healthcheck`.

## Repository conventions

- Use TypeScript and Vue SFCs; follow the existing style: four-space indentation, single quotes, no semicolons, trailing commas, and Prettier/ESLint formatting.
- Keep naming consistent with the repo structure: Vue components use PascalCase, composables start with `use`, and infrastructure files are named by role (for example `auth.service.ts`, `permission.repository.ts`, `login-request.dto.ts`).
- Database naming is `snake_case` via Prisma `@@map` and `@map` directives; table and column names should follow this convention even when model names are camel-case.
- Keep frontend and backend responsibilities separated: UI concerns stay in `app/`; API orchestration, validation, and persistence live under `server/`.
- Prefer working within the existing domain modules and route registries instead of introducing new top-level patterns.
- `APP_BASE_URL`, `SMTP_*`, and invitation/expiry env values are part of the app’s default configuration; support these values when adding mail-driven or invitation-based flows.
- The repo already documents key workflow notes in `README.md`, `AGENTS.md`, and `CLAUDE.md`; if these conflict, follow the codebase conventions reflected in the implementation and keep changes consistent with the structure above.
