export interface AuthPermissionDto {
    id: string
    name: string
    code: string
    resource: string
    action: string
    description: string | null
}

export interface AuthRoleDto {
    id: string
    name: string
    code: string
    description: string | null
    permissions: AuthPermissionDto[]
}

export interface AuthUserDto {
    id: string
    email: string
    username: string | null
    roles: AuthRoleDto[]
    permissions: AuthPermissionDto[]
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
