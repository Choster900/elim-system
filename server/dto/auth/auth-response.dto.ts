export interface AuthPermissionDto {
    id: number
    name: string
    code: string
    resource: string
    action: string
    description: string | null
}

export interface AuthRoleDto {
    id: number
    name: string
    code: string
    description: string | null
    permissions: AuthPermissionDto[]
}

export interface AuthUserDto {
    id: number
    email: string
    username: string | null
    mustChangePassword: boolean
    roles: AuthRoleDto[]
    permissions: AuthPermissionDto[]
    tokenExpiresAt?: number | null
}

export interface AuthTokensDto {
    tokenType: 'Bearer'
    accessToken: string
    accessTokenExpiresIn: number
    refreshTokenExpiresIn: number
}

export interface AuthResponseDto {
    user: AuthUserDto
    tokens: AuthTokensDto
}
