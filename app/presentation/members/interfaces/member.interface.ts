export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'VISITOR' | 'TRANSFERRED' | 'DECEASED'
export type MemberGender = 'FEMALE' | 'MALE' | 'OTHER' | 'UNSPECIFIED'
export type MemberMaritalStatus =
    | 'SINGLE'
    | 'MARRIED'
    | 'DIVORCED'
    | 'WIDOWED'
    | 'UNION'
    | 'UNSPECIFIED'
export type MemberCommunityRole =
    | 'MEMBER'
    | 'PASTOR'
    | 'LEADER'
    | 'HOST'
    | 'SUPERVISOR'
    | 'DEACON'
    | 'VOLUNTEER'
    | 'TEACHER'
    | 'WORSHIP'
    | 'YOUTH_LEADER'
    | 'CHILDREN_LEADER'

export interface Member {
    id: string
    code: string
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
    municipality: string | null
    department: string | null
    occupation: string | null
    status: MemberStatus
    roles: MemberCommunityRole[]
    ministries: string[]
    joinedAt: string | null
    conversionDate: string | null
    baptismDate: string | null
    district: string | null
    zone: string | null
    sector: string | null
    smallGroup: string | null
    emergencyContactName: string | null
    emergencyContactPhone: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
}

export interface MemberInput {
    code?: string
    firstName: string
    middleName?: string | null
    lastName: string
    secondLastName?: string | null
    preferredName?: string | null
    documentNumber?: string | null
    birthDate?: string | null
    gender?: MemberGender
    maritalStatus?: MemberMaritalStatus
    phone?: string | null
    alternatePhone?: string | null
    email?: string | null
    address?: string | null
    municipality?: string | null
    department?: string | null
    occupation?: string | null
    status?: MemberStatus
    roles?: MemberCommunityRole[]
    ministries?: string[]
    joinedAt?: string | null
    conversionDate?: string | null
    baptismDate?: string | null
    district?: string | null
    zone?: string | null
    sector?: string | null
    smallGroup?: string | null
    emergencyContactName?: string | null
    emergencyContactPhone?: string | null
    notes?: string | null
}

export interface MemberImportResult {
    created: number
    updated: number
    total: number
}
