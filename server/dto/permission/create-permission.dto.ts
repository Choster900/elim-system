export interface CreatePermissionDto {
    name: string
    code: string
    resource: string
    action: string
    description?: string
}
