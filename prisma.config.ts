import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        seed: 'node prisma/seed/index.mjs',
    },
    datasource: {
        // El CLI (migrate, diff, studio) necesita conexión directa: el pooler en modo
        // transacción de Supabase no soporta el DDL ni los advisory locks de Migrate.
        // El runtime sigue usando DATABASE_URL, que sí puede apuntar al pooler.
        // `||`, no `??`: una DIRECT_DATABASE_URL declarada pero vacía —lo normal en
        // local— tiene que caer a DATABASE_URL, no romper con "connection url is empty".
        url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '',
        shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
    },
})
