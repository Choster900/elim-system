import process from 'node:process'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'host.docker.internal', 'postgres'])

/**
 * Conexión que usan los seeds. Igual que las migraciones, prefieren la conexión
 * directa: el pooler en modo transacción agrega latencia por sentencia y una
 * siembra manda muchas seguidas dentro de una misma transacción.
 */
export function resolveSeedConnectionString() {
    return process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL
}

/**
 * Describe la base de datos destino sin exponer credenciales.
 * Se usa para imprimir contra qué se está sembrando antes de escribir nada.
 */
export function describeTarget() {
    const raw = resolveSeedConnectionString()

    if (!raw) {
        throw new Error('DATABASE_URL no está definida. Revisa tu archivo .env.')
    }

    let url
    try {
        url = new URL(raw)
    } catch {
        throw new Error('DATABASE_URL no es una URL válida de PostgreSQL.')
    }

    const host = url.hostname
    const database = url.pathname.replace(/^\//, '') || '(sin nombre)'
    const isLocal = LOCAL_HOSTS.has(host)
    const isSupabase = host.endsWith('.supabase.co') || host.endsWith('.supabase.com')
    // Solo el modo transacción (6543) es problemático. El session pooler comparte
    // el host pero escucha en el 5432 y se comporta como una conexión normal.
    const isPooler = url.port === '6543'

    return { host, port: url.port || '5432', database, isLocal, isSupabase, isPooler }
}

/**
 * Corta la ejecución cuando el destino no es local y no hubo autorización explícita.
 * Evita que un `npm run prisma:seed` escrito por costumbre caiga sobre producción.
 */
export function assertTargetAllowed(target, { scriptName, allowFlag }) {
    console.log(`[${scriptName}] Destino: ${target.host}:${target.port}/${target.database}`)

    if (target.isPooler) {
        console.warn(
            `[${scriptName}] Conexión a través del pooler en modo transacción. ` +
                'Define DIRECT_DATABASE_URL (puerto 5432) para sembrar por la conexión directa.',
        )
    }

    if (target.isLocal) return

    if (process.env[allowFlag] !== 'true') {
        throw new Error(
            `La base de datos destino no es local (${target.host}).\n` +
                `Si es intencional, vuelve a ejecutar con ${allowFlag}=true.\n` +
                'Antes de hacerlo, confirma que tienes un respaldo reciente.',
        )
    }

    console.warn(`[${scriptName}] ${allowFlag}=true — escribiendo sobre una base remota.`)
}

/**
 * En bases remotas las credenciales del administrador no pueden quedar en los
 * valores por defecto del repositorio, que son públicos.
 */
export function assertAdminCredentials(target, scriptName) {
    if (target.isLocal) return

    const email = process.env.SEED_ADMIN_EMAIL
    const password = process.env.SEED_ADMIN_PASSWORD

    if (!email || !password) {
        throw new Error(
            'En una base remota debes definir SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD.\n' +
                'Los valores por defecto (admin@local.test / Admin12345!) están en el repositorio.',
        )
    }

    if (password.length < 12) {
        throw new Error('SEED_ADMIN_PASSWORD debe tener al menos 12 caracteres en bases remotas.')
    }

    console.log(`[${scriptName}] Credenciales de administrador tomadas de SEED_ADMIN_*.`)
}
