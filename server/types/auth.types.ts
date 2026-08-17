export interface AccessTokenPayload {
    sub: string
    email: string
    type: 'access'
    roles: string[]
    permissions: string[]
    mustChangePassword: boolean
    iat?: number
    exp?: number
}

export interface RefreshTokenPayload {
    sub: string
    type: 'refresh'
    sid: string
    iat?: number
    exp?: number
}

export interface AuthenticatedUserContext {
    userId: number
    email: string
    roles: string[]
    permissions: string[]
    mustChangePassword: boolean
    tokenExpiresAt: number | null
}
