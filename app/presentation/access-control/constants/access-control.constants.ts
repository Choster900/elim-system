import type {
    AccessControlSection,
    AccessRecordStatus,
} from '../interfaces/access-control.interface'

export const accessSectionPermissions: Record<AccessControlSection, string> = {
    users: 'users.view',
    roles: 'roles.view',
    permissions: 'permissions.view',
}

export const accessStatusOptions: { value: AccessRecordStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INACTIVE', label: 'Inactivo' },
]

export const accessModuleOptions = [
    { value: 'Comunidad', label: 'Comunidad' },
    { value: 'Seguridad', label: 'Seguridad' },
    { value: 'Catálogos', label: 'Catálogos' },
    { value: 'Ministerios', label: 'Ministerios' },
    { value: 'Finanzas', label: 'Finanzas' },
    { value: 'Reportes', label: 'Reportes' },
]

export const permissionActionOptions = [
    { value: 'view', label: 'Consultar' },
    { value: 'create', label: 'Crear' },
    { value: 'update', label: 'Modificar' },
    { value: 'delete', label: 'Eliminar' },
    { value: 'manage', label: 'Administrar' },
    { value: 'export', label: 'Exportar' },
    { value: 'block', label: 'Bloquear' },
]

export function getAccessStatusLabel(status: AccessRecordStatus) {
    return accessStatusOptions.find((option) => option.value === status)?.label ?? status
}
