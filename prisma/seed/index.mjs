import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { assertTargetAllowed, describeTarget, resolveSeedConnectionString } from './seed-target.mjs'
import { seedAdminUser, seedAdminRoleAssignment } from './seeders/admin-user.seeder.mjs'
import { seedPermissions } from './seeders/permission.seeder.mjs'
import { seedRolePermissionAssignments, seedRoles } from './seeders/role.seeder.mjs'
import { seedMembers } from './seeders/member.seeder.mjs'
import { seedTerritories } from './seeders/territory.seeder.mjs'
import { seedMeetingTypes, seedMeetings } from './seeders/meeting.seeder.mjs'
import { seedOfferingCategories, seedOfferings } from './seeders/offering.seeder.mjs'
import { seedAttendanceTypes } from './seeders/attendance.seeder.mjs'

// Este seed inserta datos de prueba (miembros, reuniones, ofrendas). Contra una
// base remota casi nunca es lo que se quiere: ahí va `npm run prisma:seed:minimal`.
try {
    assertTargetAllowed(describeTarget(), {
        scriptName: 'seed:full',
        allowFlag: 'SEED_ALLOW_REMOTE',
    })
} catch (error) {
    console.error(`\n[seed:full] Cancelado: ${error.message}\n`)
    process.exit(1)
}

const adapter = new PrismaPg({ connectionString: resolveSeedConnectionString() })
const prisma = new PrismaClient({
    adapter,
    // Sobre una base remota cada sentencia cuesta latencia de red y los lotes
    // superan el timeout de transacción de 5 s que Prisma aplica por defecto.
    transactionOptions: { maxWait: 15_000, timeout: 60_000 },
})

async function seed() {
    const permissions = await seedPermissions(prisma)
    const roles = await seedRoles(prisma)
    await seedRolePermissionAssignments(prisma, roles, permissions)

    const adminUser = await seedAdminUser(prisma)
    const superAdminRole = roles.find((role) => role.code === 'SUPER_ADMIN')
    if (!superAdminRole) throw new Error('SUPER_ADMIN seed role was not created.')

    await seedAdminRoleAssignment(prisma, adminUser.id, superAdminRole.id)

    // Datos de prueba de la comunidad y su operación.
    const members = await seedMembers(prisma)
    const { sectors } = await seedTerritories(prisma, members)
    const meetingTypes = await seedMeetingTypes(prisma)
    const meetings = await seedMeetings(prisma, meetingTypes, sectors, members)
    const offeringCategories = await seedOfferingCategories(prisma)
    const attendanceTypes = await seedAttendanceTypes(prisma)
    const offerings = await seedOfferings(
        prisma,
        meetings,
        offeringCategories,
        attendanceTypes,
        adminUser.id,
    )

    return {
        permissions: permissions.length,
        roles: roles.length,
        members: members.size,
        meetings: meetings.size,
        offeringCategories: offeringCategories.size,
        attendanceTypes: attendanceTypes.size,
        offerings,
    }
}

seed()
    .then(async (summary) => {
        await prisma.$disconnect()
        console.log(
            `Seed completed: ${summary.roles} roles, ${summary.permissions} permissions, ` +
                `${summary.members} members, ${summary.meetings} meetings, ` +
                `${summary.offeringCategories} offering categories, ` +
                `${summary.attendanceTypes} attendance types and ${summary.offerings} offerings synchronized.`,
        )
    })
    .catch(async (error) => {
        await prisma.$disconnect()
        console.error('Seed failed:', error)
        process.exit(1)
    })
