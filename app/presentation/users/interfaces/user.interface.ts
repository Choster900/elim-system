export type SystemUserStatus = 'ACTIVE' | 'INVITED' | 'BLOCKED'

export type SystemRole = string

export interface UserMemberOption {
    id: number
    code: string
    fullName: string
    email: string | null
    phone: string | null
    communityRoles: string[]
    assignedUserId: number | null
}

export interface UserRoleOption {
    value: SystemRole
    label: string
    description: string
}

export interface SystemUser {
    id: number
    memberId: number | null
    memberCode: string
    memberName: string
    username: string
    email: string
    roles: SystemRole[]
    status: SystemUserStatus
    twoFactorEnabled: boolean
    mustChangePassword: boolean
    lastAccessAt: string | null
    createdAt: string
    invitationExpiresAt: string | null
    invitationUsedAt: string | null
}

export interface UserFormPayload {
    memberId: number | null
    username: string
    email: string
    roles: SystemRole[]
    status: SystemUserStatus
    requirePasswordChange: boolean
    twoFactorEnabled: boolean
    invitationExpiresInHours: number
}

export interface UserCatalog {
    members: UserMemberOption[]
    roles: UserRoleOption[]
    defaultInvitationExpiresInHours: number
}

export interface ResetUserPasswordPayload {
    requirePasswordChange: boolean
    invitationExpiresInHours: number
}
