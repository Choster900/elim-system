import { PERMISSION_SEEDS } from './permission.seeder.mjs'

const ALL_PERMISSION_CODES = PERMISSION_SEEDS.map((permission) => permission.code)
const ADMIN_PERMISSION_CODES = ALL_PERMISSION_CODES.filter((code) => code !== 'system.manage')

export const ROLE_SEEDS = [
    {
        name: 'Superadministrador',
        code: 'SUPER_ADMIN',
        description: 'Control total de configuración, seguridad y accesos.',
        permissionCodes: ALL_PERMISSION_CODES,
    },
    {
        name: 'Administrador',
        code: 'ADMINISTRATOR',
        description: 'Gestiona catálogos, comunidad y operación general.',
        permissionCodes: ADMIN_PERMISSION_CODES,
    },
    {
        name: 'Equipo pastoral',
        code: 'PASTORAL',
        description: 'Consulta y acompaña la información pastoral de la comunidad.',
        permissionCodes: [
            'dashboard.view',
            'members.view',
            'members.create',
            'members.update',
            'meetings.view',
            'meetings.manage',
            'territories.view',
            'reports.export',
        ],
    },
    {
        name: 'Secretaría',
        code: 'SECRETARY',
        description: 'Administra registros, reuniones y comunicaciones.',
        permissionCodes: [
            'dashboard.view',
            'members.view',
            'members.create',
            'members.update',
            'members.import_export',
            'users.view',
            'meetings.view',
            'meetings.manage',
            'territories.view',
            'reports.export',
        ],
    },
    {
        name: 'Finanzas',
        code: 'FINANCE',
        description: 'Accede a operaciones y reportes financieros.',
        permissionCodes: ['dashboard.view', 'finance.view', 'finance.manage', 'reports.export'],
    },
    {
        name: 'Solo lectura',
        code: 'READ_ONLY',
        description: 'Consulta información sin realizar cambios.',
        permissionCodes: [
            'dashboard.view',
            'members.view',
            'meetings.view',
            'territories.view',
            'roles.view',
            'permissions.view',
        ],
    },
]

export function seedRoles(prisma) {
    return prisma.$transaction(
        ROLE_SEEDS.map(({ permissionCodes: _permissionCodes, ...role }) =>
            prisma.role.upsert({
                where: { code: role.code },
                create: {
                    ...role,
                    isSystem: true,
                    status: 'ACTIVE',
                },
                update: {
                    ...role,
                    isSystem: true,
                    status: 'ACTIVE',
                },
            }),
        ),
    )
}

export function seedRolePermissionAssignments(prisma, roles, permissions) {
    const roleByCode = new Map(roles.map((role) => [role.code, role]))
    const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission]))
    const assignments = ROLE_SEEDS.flatMap((roleSeed) => {
        const role = roleByCode.get(roleSeed.code)
        if (!role) throw new Error(`Seed role not found: ${roleSeed.code}`)

        return roleSeed.permissionCodes.map((permissionCode) => {
            const permission = permissionByCode.get(permissionCode)
            if (!permission) throw new Error(`Seed permission not found: ${permissionCode}`)

            return prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: role.id,
                        permissionId: permission.id,
                    },
                },
                create: {
                    roleId: role.id,
                    permissionId: permission.id,
                },
                update: {},
            })
        })
    })

    return prisma.$transaction(assignments)
}
