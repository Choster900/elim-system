import bcrypt from 'bcryptjs'

export const ADMIN_USER_SEED_PASSWORD = 'Admin12345!'

export const ADMIN_USER_SEED = {
    email: 'admin@local.test',
    username: 'admin',
    isActive: true,
}

export async function seedAdminUser(prisma) {
    const passwordHash = await bcrypt.hash(ADMIN_USER_SEED_PASSWORD, 12)

    return prisma.user.upsert({
        where: { email: ADMIN_USER_SEED.email },
        create: {
            ...ADMIN_USER_SEED,
            passwordHash,
        },
        update: {
            username: ADMIN_USER_SEED.username,
            passwordHash,
            isActive: ADMIN_USER_SEED.isActive,
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

export async function seedAdminPermissionAssignment(prisma, roleId, permissionId) {
    return prisma.rolePermission.upsert({
        where: {
            roleId_permissionId: { roleId, permissionId },
        },
        create: { roleId, permissionId },
        update: {},
    })
}
