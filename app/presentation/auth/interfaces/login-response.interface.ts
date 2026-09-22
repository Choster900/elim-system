import type { TerritoryAssignment } from '~/presentation/shared/interfaces/territory-assignment.interface'

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
    mustChangePassword: boolean
    mfaMethod: 'NONE' | 'TOTP' | 'EMAIL'
    territoryAssignment: TerritoryAssignment | null
    roles: AuthRole[]
    permissions: AuthPermission[]
    tokenExpiresAt?: number | null
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

export interface MfaLoginChallenge {
    mfaRequired: true
    method: 'TOTP' | 'EMAIL'
    challengeToken: string
    expiresIn: number
}

export interface InvitationDetails {
    email: string
    displayName: string
    expiresAt: string
    requirePasswordChange: boolean
}

export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
}

export interface PasswordResetDetails {
    email: string
    displayName: string
    expiresAt: string
}

export interface RequestPasswordResetPayload {
    email: string
}

export interface ResetPasswordPayload {
    resetToken: string
    newPassword: string
}
