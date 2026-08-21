import type { MemberGender, MemberMaritalStatus, MemberStatus } from '@prisma/client'

export interface MemberBaseDto {
    code?: string
    firstName: string
    middleName: string | null
    lastName: string
    secondLastName: string | null
    preferredName: string | null
    documentNumber: string | null
    birthDate: string | null
    gender: MemberGender
    maritalStatus: MemberMaritalStatus
    phone: string | null
    alternatePhone: string | null
    email: string | null
    address: string | null
    country: string | null
    municipality: string | null
    department: string | null
    occupation: string | null
    status: MemberStatus
    roles: string[]
    ministries: string[]
    joinedAt: string | null
    conversionDate: string | null
    baptismDate: string | null
    sector: string | null
    smallGroup: string | null
    emergencyContactName: string | null
    emergencyContactPhone: string | null
    notes: string | null
}

export type CreateMemberDto = MemberBaseDto
export type UpdateMemberDto = Partial<MemberBaseDto>

export interface ImportMemberRowDto {
    rowNumber: number
    member: unknown
}

export interface ImportMembersDto {
    rows: ImportMemberRowDto[]
}

export interface MemberImportFailureDto {
    rowNumber: number
    reasons: string[]
}

export interface MemberImportResultDto {
    created: number
    updated: number
    rejected: number
    total: number
    failures: MemberImportFailureDto[]
}
