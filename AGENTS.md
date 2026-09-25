# Repository Guidelines

## Project Structure & Architecture

This is a Nuxt 4 full-stack TypeScript application. Frontend features live in
`app/presentation/<feature>/`; shared UI primitives are in `app/components/ui/`, and
shared presentation code is in `app/presentation/shared/`. Keep app utilities in
`app/utils/`, global styles and images in `app/assets/`, static files in `public/`, and
manual client routes in `app/router.options.ts`.

Nitro endpoints belong in `server/api/`. Maintain the API layering: request validation in
`server/validators/`, shapes in `server/dto/`, business rules in `server/services/`, and
database access in `server/repositories/`. Shared server types, constants, plugins, and
middleware live under their respective `server/` directories. Prisma schema, migrations,
and seeders are in `prisma/`; runtime configuration is in `config/`; operational scripts
are in `scripts/`.

## Development, Build, and Database Commands

- `npm install` installs dependencies and configures Husky.
- `Copy-Item .env.example .env` creates local configuration; never commit `.env` files.
- `npm run dev` generates Prisma Client, prepares the local database, and starts Nuxt.
- `npm run lint` checks ESLint rules; `npm run lint:fix` applies safe lint fixes.
- `npm run format` formats supported files with Prettier.
- `npm run build` generates Prisma Client and creates the production `.output/` bundle.
- `npm run prisma:migrate`, `npm run prisma:seed`, and `npm run db:status` manage the
  development database. Use `npm run db:deploy` for deployment migrations.
- `npm run test:smtp` verifies configured SMTP connectivity.

## Coding Style & Naming

Write TypeScript and Vue SFCs with four spaces, LF endings, single quotes, no semicolons,
trailing commas, and a 100-character line width. Prettier and Nuxt ESLint enforce these
settings; staged supported files are formatted through Husky.

Use PascalCase components (`LoginForm.vue`), `use`-prefixed composables
(`useLoginMutation.ts`), and role-oriented infrastructure files
(`auth.service.ts`, `permission.repository.ts`). Map Prisma database tables and columns to
`snake_case` with `@@map` and `@map`.

## Testing and Review

No automated test suite or coverage target is configured. Before opening a pull request,
run `npm run lint` and `npm run build`, then manually exercise changed screens and API
endpoints. If adding tests, include the test tooling and scripts in the same change and use
`*.spec.ts` filenames.

Use concise, imperative Conventional Commit messages, such as
`feat(offerings): add period filtering` or `fix(auth): refresh expired sessions`. Pull
requests should describe the user-visible result, list verification, link relevant issues,
call out migrations or new environment keys, and include screenshots for UI changes.
