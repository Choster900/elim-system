# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install

# Development — requires .env (copy from .env.example)
npm run dev                  # prisma generate + scripts/setup-db.mjs + nuxt dev on PORT
npm run nuxt:prepare         # regenerate Nuxt type stubs (.nuxt)

npm run build                # output goes to .output/ (not dist)
npm run preview

npm run lint                 # eslint .
npm run lint:fix
npm run format               # prettier over all files

npm run prisma:generate
npm run prisma:migrate       # prisma migrate dev
npm run prisma:seed          # runs prisma/seed/index.mjs
npm run prisma:studio

docker compose up --build                             # app + postgres + mailpit (UI on :8025)
docker compose -f docker-compose.prod.yml up --build
```

There is **no test runner** in this repo — no `npm test`, no framework configured. Verify changes with `npm run lint` + `npm run build` and by exercising the affected routes/endpoints. If you add tests, add the framework and scripts in the same change and use `*.spec.ts`.

## Environment

Copy `.env.example` to `.env`. `config/env.ts` validates `process.env` with Joi at Nuxt startup/build and throws with the full list of problems if anything is invalid.

Required: `DATABASE_URL` (any standard PostgreSQL URI — local, Supabase, Neon…), `JWT_SECRET` (min 32 chars), `NUXT_PUBLIC_APP_NAME`. Everything else has defaults: `PORT` (3000), `NODE_ENV`, `APP_BASE_URL` (used to build invitation links), `SMTP_*` / `MAIL_FROM` (Mailpit defaults on 127.0.0.1:1025), `USER_INVITATION_TTL_HOURS` (24, max 168). `SEED_ADMIN_*` is read by the seeder only.

`npm run dev` calls `scripts/setup-db.mjs`, which connects to `DATABASE_URL`, and if the database does not exist creates it and runs `prisma db push`.

## Architecture

Nuxt 4 full-stack: Vue 3 frontend in `app/`, Nitro API in `server/`, Prisma 7 + PostgreSQL. The domain is a church management system (members, meetings, offerings, territories, users, access control); routes, DB names, and user-facing messages are in Spanish.

### Prisma 7

`prisma/schema.prisma` has **no `url` in the datasource block** — Prisma 7 gets the connection through the `@prisma/adapter-pg` adapter. The URL is wired in two places: `prisma.config.ts` (CLI: schema path, migrations path, seed command) and `server/database/prisma.ts` (the runtime singleton). Always import the singleton; never construct a `PrismaClient`.

### Database naming standard (non-negotiable)

Physical DB names follow the corporate 2017 standard documented in `.agents/skills/database-standards/` — read `references/database-standard-2017.md` before touching the schema, a migration, or any SQL. In short: physical names are lowercase Spanish `snake_case`, singular, with a three-letter entity prefix (`mie_miembro`, `mie_primer_nombre`), join tables use `axb` style prefixes (`uxr_usuario_rol`), and constraints are explicitly named via `map:` (`pk_`, `uk_`, `fk_`). Prisma model/field identifiers stay camel-case English and are bridged with `@map`/`@@map`. Enums are mapped the same way. Don't rename existing physical objects incidentally.

### Routing (manual, permission-aware)

Routes are **not** file-system based. Each presentation module exports its own `router.index.ts`, and `app/router.options.ts` concatenates them. Adding a screen means adding an entry to the module's `router.index.ts` (and registering the module in `router.options.ts` if it's new).

Route `meta` drives everything: `layout` (`dashboard` | `auth` | `public` | `default`), `requiresAuth`, `requiredPermission` (a code from `app/presentation/auth/constants/permission.constants.ts`), and optionally `sectionPermissions` for `?section=` sub-views.

`app/middleware/authorization.global.ts` runs on every navigation: it hydrates the session from `GET /api/auth/me` on first load, redirects unauthenticated users to `/login`, forces `/cambiar-clave` when `mustChangePassword` is set, and sends permission failures to `/acceso-denegado`.

### Auth & permissions

Login sets **httpOnly cookies** (`access_token` / `refresh_token`, `sameSite: strict`, secure in production) — see `server/utils/auth/auth-cookie.util.ts` and `server/constants/auth.constants.ts`.

`server/middleware/auth.ts` guards every `/api/*` request except an explicit public allowlist (healthcheck, docs, openapi, login, refresh, logout, invitation validate). It verifies the JWT and populates `event.context.auth` with `userId`, `roles`, `permissions`, `mustChangePassword`. When a password change is pending, only `/api/auth/me` and `/api/auth/change-password` are reachable.

Handlers then call `requirePermission(event, 'meetings.manage')`. The `system.manage` permission bypasses every check, on both server (`require-permission.util.ts`) and client (`auth.store.ts` `hasPermission`). Keep permission codes in sync between `permission.constants.ts` and the seeded permissions.

Row-level visibility is separate: `server/services/access-scope.service.ts` resolves which sectors a user may see (admin/finance roles see everything; supervisors are limited to their assigned `TerritorySector`s). Any new listing over meetings/offerings should go through it rather than re-implementing the filter.

### Server layering

`server/api/<resource>/index.<method>.ts` (Nitro file routing) → `services/` (business logic) → `repositories/` (Prisma access). Validation schemas live in `validators/` (Joi), request/response shapes in `dto/<resource>/`.

Every handler follows the same shape — deviating breaks the response contract the frontend relies on:

```ts
export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'meetings.manage')
        const dto = validateDto(createMeetingSchema, await readBody(event))
        const data = await createMeeting(dto)
        return ApiResponseFactory.success(data, 'Reunión creada correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
```

All responses use the envelope `{ success, message, data, error: { code, details, fields }, meta: { timestamp, … } }`. `validateDto` throws a 400 carrying per-field errors; `handleApiError` maps status codes to `ApiErrorCode` values, hides 5xx details outside development, and sets the HTTP status.

New endpoints should also be added to the hand-written OpenAPI spec in `server/utils/openapi/api-docs.util.ts`. Swagger/Scalar UI: `GET /api/docs`; spec: `GET /api/openapi.json`; healthcheck: `GET /api/healthcheck`.

### Frontend data flow

`app/plugins/api-client.ts` provides `$apiClient` (Axios) globally, built by `app/infrastructure/http/axios/`. Interceptors add a request ID, default headers, a bearer token from the `access_token` cookie, normalized error handling, and dev logging. The base URL resolves to `/api` on the client and to an absolute origin during SSR (`build-api-base-url.util.ts`).

The chain is: **service** (plain function taking `apiClient` + optional `AbortSignal`, unwrapping the envelope) → **composable** (`useQuery`/`useMutation`) → **view/component**. Get the client via `useApiClient()`, never by creating an Axios instance. Query keys are centralized in `app/constants/query-keys.ts` — add new ones there instead of inlining arrays.

### Presentation modules

`app/presentation/<feature>/` with `components/`, `composables/`, `constants/`, `interfaces/`, `services/`, `stores/`, `utils/`, `view/`, plus `router.index.ts`. Cross-feature pieces live in `app/presentation/shared/`; design-system primitives (Button, Input, DataTable…) in `app/components/ui/`.

### Theme system

A `tagPriority: 'critical'` inline script in `nuxt.config.ts` sets the `dark`/`light` class on `<html>` before first paint (reading `localStorage['app-theme-mode']`, falling back to `prefers-color-scheme`). Runtime state lives in `app/infrastructure/theme/`, toggled through `app/plugins/theme-mode.client.ts` and `useThemeMode()`. Theme tokens are in `app/assets/styles/themes/{light,dark}/theme.css`.

### Path aliases (nuxt.config.ts)

| Alias           | Path                    |
| --------------- | ----------------------- |
| `@presentation` | `app/presentation`      |
| `@shared`       | `app/shared`            |
| `@interfaces`   | `app/shared/interfaces` |
| `@types`        | `app/types`             |
| `@utils`        | `app/utils`             |
| `@constants`    | `app/constants`         |
| `@services`     | `app/services`          |
| `@lib`          | `app/lib`               |

Most existing code uses `~/…` for app paths and relative imports inside `server/`; follow the neighbouring files.

## Conventions

- 4-space indent, single quotes, no semicolons, trailing commas, 100-char print width (Prettier + `@nuxt/eslint` stylistic config).
- Vue components PascalCase; composables `useX.ts`; other files named by role: `auth.service.ts`, `permission.repository.ts`, `login-request.dto.ts`, `jwt.util.ts`.
- User-facing strings and API messages are written in Spanish; route paths too (`/catalogos/reuniones`, `/cambiar-clave`).
- Husky + lint-staged run Prettier on staged files at commit time. No conventional-commit enforcement, though history mostly uses `feat:`/`fix:` prefixes.
- Document any new env key in `.env.example` and in the Joi schema in `config/env.ts`; never commit real values.
