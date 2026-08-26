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
        permissionCodes: [
            'dashboard.view',
            'finance.view',
            'finance.record',
            'finance.manage',
            'reports.export',
        ],
    },
    {
        name: 'Supervisor de sector',
        code: 'SUPERVISOR',
        description: 'Registra ofrendas de las reuniones de los sectores que lidera.',
        permissionCodes: [
            'dashboard.view',
            'finance.view',
            'finance.record',
            'finance.manage',
            'reports.export',
        ],
    },
    {
        name: 'Líder de reunión',
        code: 'LEADER',
        description: 'Registra ofrendas de las reuniones donde está asignado.',
        permissionCodes: ['dashboard.view', 'finance.view', 'finance.record'],
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

    const desired = ROLE_SEEDS.map((roleSeed) => {
        const role = roleByCode.get(roleSeed.code)
        if (!role) throw new Error(`Seed role not found: ${roleSeed.code}`)

        const permissionIds = roleSeed.permissionCodes.map((permissionCode) => {
            const permission = permissionByCode.get(permissionCode)
            if (!permission) throw new Error(`Seed permission not found: ${permissionCode}`)
            return permission.id
        })

        return { roleId: role.id, permissionIds }
    })

    // Dos sentencias, no una por rol más una por permiso: sobre una base remota
    // cada ida y vuelta cuesta decenas de milisegundos y el lote completo excedía
    // el timeout de transacción.
    //
    // Quitar un permiso del seed tiene que revocarlo de verdad: sin esta limpieza
    // un rol conserva para siempre los permisos que tuvo en una siembra anterior.
    const revocation = prisma.rolePermission.deleteMany({
        where: {
            OR: desired.map(({ roleId, permissionIds }) => ({
                roleId,
                permissionId: { notIn: permissionIds },
            })),
        },
    })

    // `skipDuplicates` sustituye al upsert: la tabla puente no tiene más campos
    // que actualizar, así que crear lo que falta equivale a la siembra anterior.
    const assignment = prisma.rolePermission.createMany({
        data: desired.flatMap(({ roleId, permissionIds }) =>
            permissionIds.map((permissionId) => ({ roleId, permissionId })),
        ),
        skipDuplicates: true,
    })

    return prisma.$transaction([revocation, assignment])
}
