export interface CreateRoleDto {
    name: string
    code: string
    description: string
    status: 'ACTIVE' | 'INACTIVE'
    permissionIds: number[]
}

export type UpdateRoleDto = CreateRoleDto
