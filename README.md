# Nuxt Enterprise Template

Plantilla profesional para Nuxt con TypeScript, Tailwind, Pinia, TanStack Query, Prisma y Supabase PostgreSQL, lista para escalar en frontend y backend.

## 1) Descripción del proyecto

Base modular para aplicaciones full-stack con Nuxt/Nitro. Incluye pantalla inicial `Hola mundo`, arquitectura por `presentation`, validación estricta de entorno y contenedorización para desarrollo/producción.

## 2) Stack usado

- Nuxt 4 + Nitro
- TypeScript
- Tailwind CSS
- Pinia (`@pinia/nuxt`)
- TanStack Query (`@tanstack/vue-query`)
- Axios (cliente HTTP con interceptores)
- Prisma ORM
- PostgreSQL (Supabase)
- Joi (validación de entorno)
- Swagger UI + OpenAPI 3
- Docker + Docker Compose
- ESLint + Prettier + EditorConfig

## 3) Estructura de carpetas

```txt
.
├─ app/
│  ├─ app.vue
│  ├─ assets/
│  │  ├─ images/ icons/ svg/ fonts/ logos/
│  │  └─ styles/
│  │     ├─ base/
│  │     ├─ themes/dark/
│  │     ├─ themes/light/
│  │     └─ tailwind/
│  ├─ config/
│  ├─ constants/
│  ├─ presentation/
│  │  ├─ auth/
│  │  ├─ register/
│  │  ├─ landing/
│  │  └─ ...
│  ├─ layouts/
│  ├─ middleware/
│  ├─ plugins/
│  ├─ services/
│  ├─ shared/
│  │  ├─ components/
│  │  ├─ composables/
│  │  └─ interfaces/
│  ├─ stores/
│  ├─ types/
│  └─ utils/
├─ config/
│  └─ env.ts
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed/
├─ server/
│  ├─ api/
│  │  ├─ healthcheck/index.get.ts
│  │  ├─ docs/index.get.ts
│  │  └─ openapi.json/index.get.ts
│  ├─ database/
│  ├─ services/
│  ├─ repositories/
│  ├─ utils/
│  ├─ validators/
│  └─ middleware/
└─ docker files...
```

## 4) Convenciones para nombrar rutas

```txt
app/presentation/<feature-name>/view/
  index.vue
```

- Cada vista de ruta vive dentro de su módulo en `app/presentation/<feature-name>/view`.
- Rutas protegidas con middleware en `app/middleware`.
- El mapeo de rutas se centraliza en `app/router.options.ts`.

## 5) Convenciones para módulos presentation

Cada módulo vive en `app/presentation/<feature-name>/` con:

- `components/`
- `interfaces/`
- `view/`
- `composables/`
- `services/`
- `stores/`

`view` contiene ensamblado de UI del módulo; `components` piezas reutilizables internas.

## 6) Convenciones para componentes

- Compartidos globales en `app/shared/components`.
- Específicos de dominio dentro de su módulo.
- Nombrado PascalCase (`AuthLoginForm.vue`).

## 7) Convenciones para interfaces y tipos

- Tipos globales en `app/types`.
- Interfaces compartidas de contrato en `app/shared/interfaces`.
- Interfaces de dominio dentro de cada módulo.

## 8) Convenciones para servicios y repositorios

- Cliente HTTP frontend en `app/services/http`.
- Lógica server-side en `server/services`.
- Acceso a datos server-side en `server/repositories`.
- Prisma singleton en `server/database/prisma.ts`.

## 9) Variables de entorno

Crear `.env` desde `.env.example`:

```env
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=
NUXT_PUBLIC_APP_NAME=
NUXT_PUBLIC_APP_URL=
NODE_ENV=
```

La validación está en `config/env.ts` (Joi). Si falta una variable crítica, Nuxt falla al arrancar/build con mensaje explícito.

## 10) Supabase + Prisma

1. Crear proyecto en Supabase y obtener connection strings.
2. Asignar `DATABASE_URL` y `DIRECT_URL` (pooling y direct).
3. Ejecutar:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 11) Instalación de dependencias

```bash
npm install
```

## 12) Ejecutar en desarrollo (local)

```bash
# Linux/macOS
cp .env.example .env
# PowerShell
Copy-Item .env.example .env
npm run dev
```

`npm run dev` usa el puerto definido en `PORT`.
Ejemplo:

```bash
# Linux/macOS
PORT=4000 npm run dev
# PowerShell
$env:PORT=4000; npm run dev
```

Si `NUXT_PUBLIC_APP_URL` está vacío, se resuelve automáticamente como `http://127.0.0.1:${PORT}`.

## 13) Ejecutar con Docker (desarrollo)

```bash
docker compose up --build
```

## 14) Build de producción

```bash
npm run build
npm run preview
```

Nuxt genera `.output/` (no `dist`) para runtime Node con Nitro. El contenedor de producción arranca con:

```bash
node .output/server/index.mjs
```

## 15) Ejecutar con Docker (producción)

```bash
docker compose -f docker-compose.prod.yml up --build
```

La imagen de producción usa build args desde `.env` para pasar variables requeridas en el `nuxt build`.

## 16) Migraciones Prisma

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

## 17) Recomendaciones para escalar

- Crear feature por dominio de negocio, no por tipo técnico.
- Mantener contratos DTO/interface versionados.
- Centralizar errores y validadores en `server/validators`.
- Implementar repositorios por agregado y tests por feature.
- Evitar exponer secretos en `runtimeConfig.public`.
- Usar `DIRECT_URL` para migraciones y `DATABASE_URL` para runtime.
- Mantener imágenes Docker pequeñas y reproducibles con `npm ci`.

## 18) Swagger y healthcheck

- Swagger UI: `GET /api/docs`
- OpenAPI JSON: `GET /api/openapi.json`
- Healthcheck: `GET /api/healthcheck`
- La vista `Hola mundo` consume `healthcheck` con TanStack Query.

## 19) Estructura Axios

```txt
app/services/http/axios/
  interceptors/
  create-axios-client.ts
  index.ts
```

```txt
app/constants/http/
app/shared/interfaces/http/
app/utils/http/
```

- Inyección global vía plugin: `app/plugins/api-client.ts` (`$apiClient`)
- Interceptores incluidos:
    - request id (`x-request-id`)
    - headers por defecto (`accept/content-type`)
    - auth bearer opcional por cookie `access_token`
    - normalización de errores
    - logging en desarrollo

## Scripts disponibles

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run lint:fix
npm run format
npm run prepare
npm run nuxt:prepare
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio
```

## Husky para formateo

- Hook `pre-commit` configurado para ejecutar `lint-staged`.
- `lint-staged` formatea archivos staged con Prettier.
- No se configuraron reglas de conventional commits.
