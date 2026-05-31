import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { seedAdminUser, seedAdminRoleAssignment, seedAdminPermissionAssignment } from './seeders/admin-user.seeder.mjs'
import { seedAdminPermission } from './seeders/permission.seeder.mjs'
import { seedAdminRole } from './seeders/role.seeder.mjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function seed() {
    const role = await seedAdminRole(prisma)
    const permission = await seedAdminPermission(prisma)
    const adminUser = await seedAdminUser(prisma)

    await seedAdminRoleAssignment(prisma, adminUser.id, role.id)
    await seedAdminPermissionAssignment(prisma, role.id, permission.id)
}

seed()
    .then(async () => {
        await prisma.$disconnect()
        console.log('Seed completed: admin user, admin profile and one permission created.')
    })
    .catch(async (error) => {
        await prisma.$disconnect()
        console.error('Seed failed:', error)
        process.exit(1)
    })
