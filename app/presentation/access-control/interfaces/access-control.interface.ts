export type AccessRecordStatus = 'ACTIVE' | 'INACTIVE'
export type AccessControlSection = 'users' | 'roles' | 'permissions'

export interface AccessPermission {
    id: number
    name: string
    code: string
    module: string
    resource: string
    action: string
    description: string
    isSystem: boolean
    status: AccessRecordStatus
    roleCount: number
}

export interface AccessRole {
    id: number
    name: string
    code: string
    description: string
    isSystem: boolean
    status: AccessRecordStatus
    userCount: number
    permissionIds: number[]
    updatedAt: string
}

export interface RoleFormPayload {
    name: string
    code: string
    description: string
    status: AccessRecordStatus
    permissionIds: number[]
}

export interface PermissionFormPayload {
    name: string
    code: string
    module: string
    resource: string
    action: string
    description: string
    status: AccessRecordStatus
}
