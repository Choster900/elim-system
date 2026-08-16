import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { seedAdminUser, seedAdminRoleAssignment } from './seeders/admin-user.seeder.mjs'
import { seedPermissions } from './seeders/permission.seeder.mjs'
import { seedRolePermissionAssignments, seedRoles } from './seeders/role.seeder.mjs'
import { seedMembers } from './seeders/member.seeder.mjs'
import { seedTerritories } from './seeders/territory.seeder.mjs'
import { seedMeetingTypes, seedMeetings } from './seeders/meeting.seeder.mjs'
import { seedOfferingCategories, seedOfferings } from './seeders/offering.seeder.mjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

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
    const offerings = await seedOfferings(prisma, meetings, offeringCategories, adminUser.id)

    return {
        permissions: permissions.length,
        roles: roles.length,
        members: members.size,
        meetings: meetings.size,
        offeringCategories: offeringCategories.size,
        offerings,
    }
}

seed()
    .then(async (summary) => {
        await prisma.$disconnect()
        console.log(
            `Seed completed: ${summary.roles} roles, ${summary.permissions} permissions, ` +
                `${summary.members} members, ${summary.meetings} meetings, ` +
                `${summary.offeringCategories} offering categories and ${summary.offerings} offerings synchronized.`,
        )
    })
    .catch(async (error) => {
        await prisma.$disconnect()
        console.error('Seed failed:', error)
        process.exit(1)
    })
