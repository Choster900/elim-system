import bcrypt from 'bcryptjs'

export async function seedAdminUser(prisma) {
    const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@local.test'
    const username = process.env.SEED_ADMIN_USERNAME ?? 'admin'
    const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin12345!'

    if (password.length < 8) {
        throw new Error('SEED_ADMIN_PASSWORD must contain at least 8 characters.')
    }

    const passwordHash = await bcrypt.hash(password, 12)

    return prisma.user.upsert({
        where: { email },
        create: {
            email,
            username,
            passwordHash,
            isActive: true,
            status: 'ACTIVE',
            mustChangePassword: false,
            twoFactorEnabled: false,
        },
        update: {
            username,
            passwordHash,
            isActive: true,
            status: 'ACTIVE',
            mustChangePassword: false,
        },
    })
}

export async function seedAdminRoleAssignment(prisma, userId, roleId) {
    return prisma.userRole.upsert({
        where: {
            userId_roleId: { userId, roleId },
        },
        create: { userId, roleId },
        update: {},
    })
}
