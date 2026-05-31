# Nuxt Enterprise Template

Plantilla profesional para Nuxt con TypeScript, Tailwind, Pinia, TanStack Query, Prisma y PostgreSQL, lista para escalar en frontend y backend.

## 1) Descripción del proyecto

Base modular para aplicaciones full-stack con Nuxt/Nitro. Incluye arquitectura por `presentation`, validación estricta de entorno, Response Envelope estándar para APIs y contenedorización para desarrollo/producción.

## 2) Stack usado

- Nuxt 4 + Nitro
- TypeScript
- Tailwind CSS
- Pinia (`@pinia/nuxt`)
- TanStack Query (`@tanstack/vue-query`)
- Axios (cliente HTTP con interceptores)
- Prisma 7 ORM + `@prisma/adapter-pg`
- PostgreSQL (local o Supabase)
- Joi (validación de entorno y DTOs)
- Scalar + OpenAPI 3 (documentación API)
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
├─ scripts/
│  └─ setup-db.mjs
├─ server/
│  ├─ api/
│  │  ├─ healthcheck/index.get.ts
│  │  ├─ docs/index.get.ts
│  │  ├─ openapi.json/index.get.ts
│  │  └─ permissions/
│  │     ├─ index.get.ts
│  │     ├─ index.post.ts
│  │     ├─ [id].get.ts
│  │     ├─ [id].put.ts
│  │     └─ [id].delete.ts
│  ├─ database/
│  ├─ dto/
│  │  └─ <resource>/
│  │     ├─ create-<resource>.dto.ts
│  │     ├─ update-<resource>.dto.ts
│  │     └─ <resource>-response.dto.ts
│  ├─ repositories/
│  ├─ services/
│  ├─ types/
│  │  └─ api-response.types.ts
│  ├─ utils/
│  │  ├─ response.util.ts
│  │  ├─ error-handler.util.ts
│  │  ├─ validate-dto.util.ts
│  │  ├─ prisma-error.util.ts
│  │  └─ pagination.util.ts
│  ├─ validators/
│  └─ middleware/
└─ docker files...
```

## 4) Variables de entorno

Crear `.env` desde `.env.example`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb
PORT=3000
NODE_ENV=development
NUXT_PUBLIC_APP_NAME=MyApp
```

La validación está en `config/env.ts` (Joi). Si falta una variable crítica, Nuxt falla al arrancar con mensaje explícito.

`DATABASE_URL` acepta cualquier conexión PostgreSQL estándar — local, Supabase, Neon, Railway, etc.

## 5) Prisma 7 + adaptador pg

Prisma 7 no lee la URL desde `schema.prisma`. La conexión se configura mediante el adaptador `@prisma/adapter-pg`:

```ts
// server/database/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
    return new PrismaClient({ adapter })
}
```

La configuración CLI vive en `prisma.config.ts` en la raíz:

```ts
// prisma.config.ts
import { defineConfig } from 'prisma/config'

export default defineConfig({
    schema: './prisma/schema.prisma',
    migrate: { url: process.env.DATABASE_URL },
})
```

## 6) Convenciones de base de datos

### snake_case para tablas y columnas

Todas las tablas y columnas usan `snake_case` en la base de datos. En el schema de Prisma se usa `@@map` para tablas y `@map` para columnas:

```prisma
model UserRole {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  roleId     String   @map("role_id")
  assignedAt DateTime @default(now()) @map("assigned_at")
  assignedBy String?  @map("assigned_by")

  @@map("user_role")
}
```

### Posición de llaves foráneas

Los campos de FK van siempre en las primeras posiciones del modelo (después del `id`).

## 7) Migraciones Prisma

```bash
# Crear una migración nueva (desarrollo)
npx prisma migrate dev --name <nombre>

# Aplicar migraciones existentes (CI/producción)
npx prisma migrate deploy

# Resetear la base de datos (elimina y vuelve a crear)
npx prisma migrate reset

# Regenerar el cliente Prisma
npx prisma generate

# Sincronizar schema sin migraciones (prototipado)
npx prisma db push

# Abrir Prisma Studio
npx prisma studio

# Correr el seeder
npx prisma db seed
```

`npm run dev` ejecuta `prisma generate && node scripts/setup-db.mjs && nuxt dev`, lo que valida la conexión y crea la base de datos automáticamente si no existe.

## 8) Response Envelope estándar

Todas las respuestas de la API siguen esta estructura:

```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": { },
  "error": null,
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/permissions",
    "pagination": { }
  }
}
```

### ApiResponseFactory

```ts
// server/utils/response.util.ts
import { ApiResponseFactory } from '../utils/response.util'

// Respuesta exitosa
return ApiResponseFactory.success(data, 'Mensaje', { pagination })

// Respuesta exitosa sin contenido (DELETE)
return ApiResponseFactory.success(null, 'Eliminado correctamente')
```

### Códigos de error estándar

Definidos en `server/types/api-response.types.ts`:

| Código | Descripción |
|---|---|
| `VALIDATION_ERROR` | Payload inválido |
| `UNAUTHORIZED` | No autenticado |
| `FORBIDDEN` | Sin permisos |
| `RESOURCE_NOT_FOUND` | Recurso inexistente |
| `RESOURCE_ALREADY_EXISTS` | Conflicto de unicidad |
| `BUSINESS_RULE_ERROR` | Regla de negocio violada |
| `INVALID_CREDENTIALS` | Credenciales incorrectas |
| `TOKEN_EXPIRED` | Token vencido |
| `INVALID_TOKEN` | Token inválido |
| `INTERNAL_SERVER_ERROR` | Error interno |
| `SERVICE_UNAVAILABLE` | Servicio no disponible |

## 9) Patrón DTO

Cada recurso tiene tres archivos de DTO en `server/dto/<resource>/`:

```ts
// create-permission.dto.ts
export interface CreatePermissionDto {
    name: string
    description?: string
}

// update-permission.dto.ts
export interface UpdatePermissionDto {
    name?: string
    description?: string
}

// permission-response.dto.ts
export interface PermissionResponseDto {
    id: string
    name: string
    description: string | null
    createdAt: Date
    updatedAt: Date
}
```

### Validación en el handler

La validación ocurre en la capa handler (no en el servicio). Se usa `validateDto` con un schema Joi:

```ts
// server/api/permissions/index.post.ts
import { validateDto } from '../../utils/validate-dto.util'
import { createPermissionSchema } from '../../validators/permission.validator'
import type { CreatePermissionDto } from '../../dto/permission/create-permission.dto'

export default defineEventHandler(async (event) => {
    try {
        const dto = validateDto<CreatePermissionDto>(
            createPermissionSchema,
            await readBody(event),
        )
        const permission = await createPermission(dto)
        return ApiResponseFactory.success(permission, 'Permiso creado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
```

`validateDto` lanza un error 400 con `VALIDATION_ERROR` y el detalle de cada campo inválido si la validación falla.

### Validators (Joi)

```ts
// server/validators/permission.validator.ts
import Joi from 'joi'
import type { CreatePermissionDto } from '../dto/permission/create-permission.dto'

export const createPermissionSchema = Joi.object<CreatePermissionDto>({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().max(255).optional(),
})
```

## 10) Manejo de errores

### handleApiError

Centraliza todos los errores en el handler. Mapea status codes a `ApiErrorCode` automáticamente:

```ts
export default defineEventHandler(async (event) => {
    try {
        // ...
    } catch (error) {
        return handleApiError(event, error)
    }
})
```

### mapPrismaError

Los repositorios capturan errores de Prisma con `.catch(mapPrismaError)`. Convierte `PrismaClientKnownRequestError` en errores HTTP estándar:

| Código Prisma | HTTP | ApiErrorCode |
|---|---|---|
| `P2002` | 409 | `RESOURCE_ALREADY_EXISTS` |
| `P2025` | 404 | `RESOURCE_NOT_FOUND` |

```ts
// server/repositories/permission.repository.ts
export function createPermission(dto: CreatePermissionDto) {
    return prisma.permission.create({ data: dto }).catch(mapPrismaError)
}
```

## 11) Paginación

### Query params

```
GET /api/permissions?page=1&limit=10
```

- `page`: número de página (default: 1)
- `limit`: registros por página (default: 10, max: 100)

### Implementación en handler

```ts
import { parsePaginationParams, buildPaginationMeta } from '../../utils/pagination.util'

export default defineEventHandler(async (event) => {
    try {
        const { page, limit, skip } = parsePaginationParams(event)
        const { items, totalItems } = await getAllPermissions(skip, limit)
        const pagination = buildPaginationMeta(page, limit, totalItems)
        return ApiResponseFactory.success(items, 'Obtenidos correctamente', { pagination })
    } catch (error) {
        return handleApiError(event, error)
    }
})
```

### Estructura de respuesta paginada

```json
{
  "success": true,
  "message": "Permisos obtenidos correctamente",
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 42,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

## 12) Convenciones para rutas

```txt
app/presentation/<feature-name>/view/
  index.vue
```

- Cada vista de ruta vive dentro de su módulo en `app/presentation/<feature-name>/view`.
- Rutas protegidas con middleware en `app/middleware`.
- El mapeo de rutas se centraliza en `app/router.options.ts`.

## 13) Convenciones para módulos presentation

Cada módulo vive en `app/presentation/<feature-name>/` con:

- `components/`
- `interfaces/`
- `view/`
- `composables/`
- `services/`
- `stores/`

`view` contiene ensamblado de UI del módulo; `components` piezas reutilizables internas.

## 14) Convenciones para componentes

- Compartidos globales en `app/shared/components`.
- Específicos de dominio dentro de su módulo.
- Nombrado PascalCase (`AuthLoginForm.vue`).

## 15) Convenciones para interfaces y tipos

- Tipos globales en `app/types`.
- Interfaces compartidas de contrato en `app/shared/interfaces`.
- Interfaces de dominio dentro de cada módulo.

## 16) Convenciones para servicios y repositorios

- Cliente HTTP frontend en `app/services/http`.
- Lógica server-side en `server/services`.
- Acceso a datos server-side en `server/repositories`.
- Prisma singleton en `server/database/prisma.ts`.

## 17) Instalación de dependencias

```bash
npm install
```

## 18) Ejecutar en desarrollo

```bash
# Linux/macOS
cp .env.example .env
# PowerShell
Copy-Item .env.example .env

npm run dev
```

`npm run dev` valida la conexión a la base de datos, la crea si no existe, y arranca Nuxt en el puerto definido en `PORT`.

## 19) Ejecutar con Docker (desarrollo)

```bash
docker compose up --build
```

## 20) Build de producción

```bash
npm run build
npm run preview
```

Nuxt genera `.output/` para runtime Node con Nitro. El contenedor de producción arranca con:

```bash
node .output/server/index.mjs
```

## 21) Ejecutar con Docker (producción)

```bash
docker compose -f docker-compose.prod.yml up --build
```

## 22) Documentación API (Scalar)

- **Scalar UI**: `GET /api/docs`
- **OpenAPI JSON**: `GET /api/openapi.json`
- **Healthcheck**: `GET /api/healthcheck`

Scalar reemplaza Swagger UI. La spec OpenAPI se genera dinámicamente y la URL base se deriva del request.

## 23) Estructura Axios

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
- `lint-staged` formatea archivos staged con Prettier (4 espacios).
- No se configuraron reglas de conventional commits.
