export interface AuthPermission {
    id: number
    name: string
    code: string
    resource: string
    action: string
    description: string | null
}

export interface AuthRole {
    id: number
    name: string
    code: string
    description: string | null
    permissions: AuthPermission[]
}

export interface AuthUser {
    id: number
    email: string
    username: string | null
    roles: AuthRole[]
    permissions: AuthPermission[]
}

export interface AuthTokens {
    tokenType: 'Bearer'
    accessToken: string
    accessTokenExpiresIn: number
    refreshTokenExpiresIn: number
}

export interface LoginResponse {
    user: AuthUser
    tokens: AuthTokens
}
