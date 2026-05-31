export const ADMIN_ROLE_SEED = {
    name: 'Administrador',
    code: 'admin',
    description: 'Perfil administrativo',
    isSystem: true,
}

export async function seedAdminRole(prisma) {
    return prisma.role.upsert({
        where: { code: ADMIN_ROLE_SEED.code },
        create: ADMIN_ROLE_SEED,
        update: {
            name: ADMIN_ROLE_SEED.name,
            description: ADMIN_ROLE_SEED.description,
            isSystem: ADMIN_ROLE_SEED.isSystem,
        },
    })
}
