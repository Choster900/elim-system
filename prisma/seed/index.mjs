import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { seedAdminUser, seedAdminRoleAssignment } from './seeders/admin-user.seeder.mjs'
import { seedPermissions } from './seeders/permission.seeder.mjs'
import { seedRolePermissionAssignments, seedRoles } from './seeders/role.seeder.mjs'

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

    return { permissions: permissions.length, roles: roles.length }
}

seed()
    .then(async ({ permissions, roles }) => {
        await prisma.$disconnect()
        console.log(`Seed completed: ${roles} roles and ${permissions} permissions synchronized.`)
    })
    .catch(async (error) => {
        await prisma.$disconnect()
        console.error('Seed failed:', error)
        process.exit(1)
    })
