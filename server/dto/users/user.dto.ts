export type UserStatusDto = 'ACTIVE' | 'INVITED' | 'BLOCKED'

export interface CreateUserRequestDto {
    memberId: number
    username: string
    email: string
    roleCodes: string[]
    requirePasswordChange: boolean
    twoFactorEnabled: boolean
    invitationExpiresInHours: number
}

export interface UpdateUserRequestDto {
    username: string
    email: string
    roleCodes: string[]
    status: UserStatusDto
    requirePasswordChange: boolean
    twoFactorEnabled: boolean
}

export interface UpdateUserStatusRequestDto {
    status: Exclude<UserStatusDto, 'INVITED'>
}

export interface ResetUserPasswordRequestDto {
    requirePasswordChange: boolean
    invitationExpiresInHours: number
}
