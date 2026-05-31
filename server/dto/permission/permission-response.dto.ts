export interface PermissionResponseDto {
    id: string
    name: string
    code: string
    resource: string
    action: string
    description: string | null
    createdAt: Date
    updatedAt: Date
}
