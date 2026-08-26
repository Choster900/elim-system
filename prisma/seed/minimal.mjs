/**
 * Seed mínimo: catálogos del sistema y un único usuario administrador.
 *
 * A diferencia de `index.mjs`, no inserta miembros, territorios, reuniones ni
 * ofrendas de prueba. Es el seed pensado para una base recién migrada.
 *
 * Todas las operaciones son upsert idempotente: volver a ejecutarlo no duplica
 * filas ni borra datos existentes.
 */
import 'dotenv/config'
import process from 'node:process'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { seedAdminRoleAssignment, seedAdminUser } from './seeders/admin-user.seeder.mjs'
import { seedPermissions } from './seeders/permission.seeder.mjs'
import { seedRolePermissionAssignments, seedRoles } from './seeders/role.seeder.mjs'
import { seedMeetingTypes } from './seeders/meeting.seeder.mjs'
import { seedOfferingCategories } from './seeders/offering.seeder.mjs'
import { seedAttendanceTypes } from './seeders/attendance.seeder.mjs'
import {
    assertAdminCredentials,
    assertTargetAllowed,
    describeTarget,
    resolveSeedConnectionString,
} from './seed-target.mjs'

const SCRIPT_NAME = 'seed:minimal'

// Sobre una base remota cada sentencia cuesta decenas de milisegundos de red y el
// lote de permisos supera el timeout de 5 s que Prisma aplica por defecto.
const TRANSACTION_OPTIONS = { maxWait: 15_000, timeout: 60_000 }

try {
    const target = describeTarget()
    assertTargetAllowed(target, { scriptName: SCRIPT_NAME, allowFlag: 'SEED_ALLOW_REMOTE' })
    assertAdminCredentials(target, SCRIPT_NAME)
} catch (error) {
    console.error(`\n[${SCRIPT_NAME}] Cancelado: ${error.message}\n`)
    process.exit(1)
}

const adapter = new PrismaPg({ connectionString: resolveSeedConnectionString() })
const prisma = new PrismaClient({ adapter, transactionOptions: TRANSACTION_OPTIONS })

/**
 * El esquema debe existir antes de sembrar. Sin esta comprobación el error que
 * aparece es un "table does not exist" difícil de interpretar.
 */
async function assertSchemaPresent() {
    const [row] = await prisma.$queryRaw`
        SELECT COUNT(*)::int AS total
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN ('usu_usuario', 'per_permiso', 'rol_rol')
    `

    if (!row || row.total < 3) {
        throw new Error(
            'El esquema no está aplicado en esta base de datos.\n' +
                'Ejecuta primero: npx prisma migrate deploy',
        )
    }
}

/**
 * `seedAdminUser` reescribe el hash de contraseña del usuario existente. En una
 * base que ya está en uso eso equivale a resetear el acceso del administrador,
 * así que solo se hace cuando se pide de forma explícita.
 */
async function resolveAdminUser() {
    const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@local.test'
    const existing = await prisma.user.findUnique({ where: { email } })

    if (!existing) {
        const created = await seedAdminUser(prisma)
        console.log(`[${SCRIPT_NAME}] Usuario administrador creado: ${email}`)
        return created
    }

    if (process.env.SEED_ADMIN_RESET_PASSWORD === 'true') {
        const updated = await seedAdminUser(prisma)
        console.warn(`[${SCRIPT_NAME}] Contraseña del administrador restablecida: ${email}`)
        return updated
    }

    console.log(
        `[${SCRIPT_NAME}] El usuario ${email} ya existe; se conserva su contraseña. ` +
            'Usa SEED_ADMIN_RESET_PASSWORD=true si quieres restablecerla.',
    )
    return existing
}

async function seed() {
    await assertSchemaPresent()

    const permissions = await seedPermissions(prisma)
    const roles = await seedRoles(prisma)
    await seedRolePermissionAssignments(prisma, roles, permissions)

    const adminUser = await resolveAdminUser()
    const superAdminRole = roles.find((role) => role.code === 'SUPER_ADMIN')
    if (!superAdminRole) throw new Error('No se creó el rol SUPER_ADMIN.')

    await seedAdminRoleAssignment(prisma, adminUser.id, superAdminRole.id)

    const meetingTypes = await seedMeetingTypes(prisma)
    const offeringCategories = await seedOfferingCategories(prisma)
    const attendanceTypes = await seedAttendanceTypes(prisma)

    return {
        permissions: permissions.length,
        roles: roles.length,
        meetingTypes: meetingTypes.size,
        offeringCategories: offeringCategories.size,
        attendanceTypes: attendanceTypes.size,
    }
}

seed()
    .then(async (summary) => {
        await prisma.$disconnect()
        console.log(
            `[${SCRIPT_NAME}] Completado: ${summary.permissions} permisos, ${summary.roles} roles, ` +
                `${summary.meetingTypes} tipos de reunión, ${summary.offeringCategories} categorías de ofrenda, ` +
                `${summary.attendanceTypes} tipos de asistencia y 1 usuario administrador.`,
        )
    })
    .catch(async (error) => {
        await prisma.$disconnect().catch(() => {})
        console.error(`[${SCRIPT_NAME}] Falló:`, error.message)
        process.exit(1)
    })
