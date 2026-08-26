import 'dotenv/config'
import pkg from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { execSync } from 'node:child_process'

const { PrismaClient } = pkg

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
    console.error('[setup-db] DATABASE_URL is not set in .env')
    process.exit(1)
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'host.docker.internal', 'postgres'])

function isLocalDatabase(url) {
    try {
        return LOCAL_HOSTS.has(new URL(url).hostname)
    } catch {
        return false
    }
}

function makeClient(url) {
    const adapter = new PrismaPg({ connectionString: url })
    return new PrismaClient({ adapter })
}

async function createDatabase() {
    const dbUrl = new URL(DATABASE_URL)
    const dbName = dbUrl.pathname.replace(/^\//, '')
    dbUrl.pathname = '/postgres'

    const admin = makeClient(dbUrl.toString())
    try {
        await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`)
        console.log(`[setup-db] Database "${dbName}" created`)
    } finally {
        await admin.$disconnect().catch(() => {})
    }
}

async function main() {
    const client = makeClient(DATABASE_URL)

    try {
        // Driver adapters can initialize lazily; a real query verifies host, database and credentials.
        await client.$queryRaw`SELECT 1`
        console.log('[setup-db] Database connection verified')
        return
    } catch (error) {
        const isNotFound =
            error?.errorCode === 'P1003' || error?.message?.toLowerCase().includes('does not exist')

        if (!isNotFound) {
            console.error('[setup-db] Cannot connect to database:', error.message)
            process.exit(1)
        }
    } finally {
        await client.$disconnect().catch(() => {})
    }

    // Contra una base remota (Supabase, Neon…) no se crea nada ni se aplica `db push`:
    // ese comando sincroniza el esquema por diferencia y puede eliminar columnas con datos.
    if (!isLocalDatabase(DATABASE_URL)) {
        console.error(
            '[setup-db] La base de datos remota no respondió y este script solo prepara bases locales.\n' +
                '[setup-db] Verifica la conexión y aplica el esquema con: npx prisma migrate deploy',
        )
        process.exit(1)
    }

    // DB no existe → crearla y aplicar schema
    try {
        await createDatabase()
        console.log('[setup-db] Applying schema...')
        execSync('npx prisma db push', { stdio: 'inherit' })
        console.log('[setup-db] Schema applied')
    } catch (error) {
        console.error('[setup-db] Failed to set up database:', error.message)
        process.exit(1)
    }
}

main()
