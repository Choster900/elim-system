export type SystemUserStatus = 'ACTIVE' | 'INVITED' | 'BLOCKED'

export type SystemRole =
    | 'SUPER_ADMIN'
    | 'ADMINISTRATOR'
    | 'PASTORAL'
    | 'SECRETARY'
    | 'FINANCE'
    | 'READ_ONLY'

export interface UserMemberOption {
    id: number
    code: string
    fullName: string
    email: string | null
    phone: string | null
    communityRoles: string[]
}

export interface SystemUser {
    id: number
    memberId: number
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
}

export interface UserFormPayload {
    memberId: number
    username: string
    email: string
    password: string
    roles: SystemRole[]
    status: SystemUserStatus
    requirePasswordChange: boolean
    twoFactorEnabled: boolean
    sendWelcomeEmail: boolean
}
