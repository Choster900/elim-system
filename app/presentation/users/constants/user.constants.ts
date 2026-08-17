import type { SystemUserStatus } from '../interfaces/user.interface'

export const systemUserStatusOptions: { value: SystemUserStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INVITED', label: 'Invitado' },
    { value: 'BLOCKED', label: 'Bloqueado' },
]

export function getSystemUserStatusLabel(status: SystemUserStatus) {
    return systemUserStatusOptions.find((option) => option.value === status)?.label ?? status
}
