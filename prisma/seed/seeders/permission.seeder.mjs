export const ADMIN_PERMISSION_SEED = {
    name: 'Gestion total del sistema',
    code: 'system.manage',
    resource: 'system',
    action: 'manage',
    description: 'Permiso global para administracion del sistema',
}

export async function seedAdminPermission(prisma) {
    return prisma.permission.upsert({
        where: { code: ADMIN_PERMISSION_SEED.code },
        create: ADMIN_PERMISSION_SEED,
        update: {
            name: ADMIN_PERMISSION_SEED.name,
            resource: ADMIN_PERMISSION_SEED.resource,
            action: ADMIN_PERMISSION_SEED.action,
            description: ADMIN_PERMISSION_SEED.description,
        },
    })
}
