export interface CreatePermissionDto {
    name: string
    code: string
    module: string
    resource: string
    action: string
    description?: string
    status: 'ACTIVE' | 'INACTIVE'
}
