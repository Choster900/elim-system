import type { SystemRole, SystemUserStatus } from '../interfaces/user.interface'

export const systemRoleOptions: { value: SystemRole; label: string; description: string }[] = [
    {
        value: 'SUPER_ADMIN',
        label: 'Superadministrador',
        description: 'Control total de configuración, seguridad y accesos.',
    },
    {
        value: 'ADMINISTRATOR',
        label: 'Administrador',
        description: 'Gestiona catálogos, comunidad y operación general.',
    },
    {
        value: 'PASTORAL',
        label: 'Equipo pastoral',
        description: 'Consulta y acompaña la información de la comunidad.',
    },
    {
        value: 'SECRETARY',
        label: 'Secretaría',
        description: 'Administra registros, reuniones y comunicaciones.',
    },
    {
        value: 'FINANCE',
        label: 'Finanzas',
        description: 'Accede a ofrendas, gastos y reportes financieros.',
    },
    {
        value: 'READ_ONLY',
        label: 'Solo lectura',
        description: 'Puede consultar información sin realizar cambios.',
    },
]

export const systemUserStatusOptions: { value: SystemUserStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INVITED', label: 'Invitado' },
    { value: 'BLOCKED', label: 'Bloqueado' },
]

export function getSystemRoleLabel(role: SystemRole) {
    return systemRoleOptions.find((option) => option.value === role)?.label ?? role
}

export function getSystemUserStatusLabel(status: SystemUserStatus) {
    return systemUserStatusOptions.find((option) => option.value === status)?.label ?? status
}
