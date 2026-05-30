import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const seedProfiles = [
    {
        role: {
            name: 'Administrador',
            code: 'admin',
            description: 'Perfil administrativo',
            isSystem: true,
        },
        user: {
            email: 'admin@local.test',
            username: 'admin',
            passwordHash: 'seed_placeholder_hash_admin',
        },
    },
    {
        role: {
            name: 'Vendedor',
            code: 'vendedor',
            description: 'Perfil comercial',
            isSystem: false,
        },
        user: {
            email: 'vendedor@local.test',
            username: 'vendedor',
            passwordHash: 'seed_placeholder_hash_vendedor',
        },
    },
    {
        role: {
            name: 'Calidad',
            code: 'calidad',
            description: 'Perfil de control de calidad',
            isSystem: false,
        },
        user: {
            email: 'calidad@local.test',
            username: 'calidad',
            passwordHash: 'seed_placeholder_hash_calidad',
        },
    },
    {
        role: {
            name: 'Disenador',
            code: 'disenador',
            description: 'Perfil de diseno',
            isSystem: false,
        },
        user: {
            email: 'disenador@local.test',
            username: 'disenador',
            passwordHash: 'seed_placeholder_hash_disenador',
        },
    },
]

async function seed() {
    for (const profile of seedProfiles) {
        const role = await prisma.role.upsert({
            where: { code: profile.role.code },
            create: profile.role,
            update: {
                name: profile.role.name,
                description: profile.role.description,
                isSystem: profile.role.isSystem,
            },
        })

        const user = await prisma.user.upsert({
            where: { email: profile.user.email },
            create: {
                email: profile.user.email,
                username: profile.user.username,
                passwordHash: profile.user.passwordHash,
                isActive: true,
            },
            update: {
                username: profile.user.username,
                passwordHash: profile.user.passwordHash,
                isActive: true,
            },
        })

        await prisma.userRole.upsert({
            where: {
                userId_roleId: {
                    userId: user.id,
                    roleId: role.id,
                },
            },
            create: {
                userId: user.id,
                roleId: role.id,
            },
            update: {},
        })
    }
}

seed()
    .then(async () => {
        await prisma.$disconnect()
        console.log('Seed completed: 4 perfiles de usuario creados sin permisos.')
    })
    .catch(async (error) => {
        await prisma.$disconnect()
        console.error('Seed failed:', error)
        process.exit(1)
    })
