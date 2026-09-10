import 'dotenv/config'
import process from 'node:process'
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import pkg from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const { PrismaClient } = pkg
const ADMIN_EMAIL = 'admin@elim.com'
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'host.docker.internal', 'postgres'])

function isLocalDatabase(url) {
    try {
        return LOCAL_HOSTS.has(new URL(url).hostname)
    } catch {
        return false
    }
}

function generatePassword() {
    return `Admin${randomBytes(8).toString('base64url')}!1a`
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
    console.error('[reset-local-admin-password] DATABASE_URL is not set.')
    process.exit(1)
}

if (!isLocalDatabase(databaseUrl)) {
    console.error('[reset-local-admin-password] Refusing to run: DATABASE_URL is not local.')
    process.exit(1)
}

const password = process.argv[2] ?? process.env.LOCAL_ADMIN_PASSWORD ?? generatePassword()
if (password.length < 10) {
    console.error('[reset-local-admin-password] Password must contain at least 10 characters.')
    process.exit(1)
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
})

try {
    const user = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
        select: { id: true, email: true },
    })

    if (!user) {
        console.error(`[reset-local-admin-password] User ${ADMIN_EMAIL} was not found.`)
        process.exit(1)
    }

    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: await bcrypt.hash(password, 12),
                isActive: true,
                status: 'ACTIVE',
                mustChangePassword: false,
            },
        }),
        prisma.authSession.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: new Date() },
        }),
    ])

    console.log(`[reset-local-admin-password] Password reset for ${ADMIN_EMAIL}.`)
    if (!process.argv[2] && !process.env.LOCAL_ADMIN_PASSWORD) {
        console.log(`[reset-local-admin-password] Temporary password: ${password}`)
    }
} finally {
    await prisma.$disconnect().catch(() => {})
}
