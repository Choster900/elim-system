# Repository Guidelines

## Project Structure & Module Organization

This is a Nuxt 4 full-stack TypeScript application. Frontend code lives in `app/`: feature modules are grouped under `app/presentation/<feature>/`, reusable UI primitives are in `app/components/ui/`, shared presentation code is in `app/presentation/shared/`, and global styles and images are under `app/assets/`. Routes are registered manually in `app/router.options.ts`.

Nitro API handlers live in `server/api/`; keep business logic in `server/services/`, persistence in `server/repositories/`, validation in `server/validators/`, and request/response shapes in `server/dto/`. Prisma schema, migrations, and seeds are under `prisma/`. Static files belong in `public/`; database setup helpers belong in `scripts/`.

## Build, Test, and Development Commands

- `npm install`: install dependencies and configure Husky.
- `Copy-Item .env.example .env`: create local configuration before development.
- `npm run dev`: generate Prisma Client, prepare the database, and start Nuxt.
- `npm run build`: create the production output in `.output/`.
- `npm run preview`: serve the production build locally.
- `npm run lint`: check the repository with ESLint.
- `npm run format`: format supported files with Prettier.
- `npm run prisma:migrate`: create/apply development migrations.
- `npm run prisma:seed`: seed the configured database.
- `docker compose up --build`: run the development stack in containers.

## Coding Style & Naming Conventions

Use TypeScript and Vue Single-File Components with four-space indentation, LF endings, single quotes, no semicolons, trailing commas, and a 100-character print width. ESLint uses Nuxt's stylistic configuration; staged files are formatted by Prettier through Husky.

Name Vue components in PascalCase (`LoginForm.vue`), composables with `use` (`useLoginMutation.ts`), and infrastructure files by role (`auth.service.ts`, `permission.repository.ts`, `login-request.dto.ts`). Database tables and columns use `snake_case` through Prisma `@@map` and `@map` directives.

## Testing Guidelines

No automated test framework, coverage threshold, or `npm test` script is currently configured. Before submitting changes, run `npm run lint` and `npm run build`, then manually exercise affected routes and API endpoints. If adding tests, include the framework setup and scripts in the same change and use `*.spec.ts` consistently.

## Commit & Pull Request Guidelines

History mixes Conventional Commit prefixes (`feat:`, `feat(auth):`) with informal summaries. Prefer concise, imperative Conventional Commit messages, such as `fix(auth): refresh expired sessions`. Pull requests should explain the user-visible change, list verification performed, link relevant issues, call out migrations or environment changes, and include screenshots for UI work. Never commit `.env` values or credentials; document new keys in `.env.example`.
