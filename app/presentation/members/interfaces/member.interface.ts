export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'VISITOR' | 'TRANSFERRED' | 'DECEASED'
export type MemberGender = 'FEMALE' | 'MALE'
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

export interface Member extends Record<string, unknown> {
    id: number
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
    country: string | null
    countryCode: string | null
    municipality: string | null
    municipalityCode: string | null
    department: string | null
    departmentCode: string | null
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
    districtCode: string | null
    zoneCode: string | null
    sectorCode: string | null
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
    country?: string | null
    municipality?: string | null
    department?: string | null
    occupation?: string | null
    status?: MemberStatus
    roles?: MemberCommunityRole[]
    ministries?: string[]
    joinedAt?: string | null
    conversionDate?: string | null
    baptismDate?: string | null
    sector?: string | null
    smallGroup?: string | null
    emergencyContactName?: string | null
    emergencyContactPhone?: string | null
    notes?: string | null
}

export interface MemberImportResult {
    created: number
    updated: number
    rejected: number
    total: number
    failures: MemberImportFailure[]
}

export interface MemberImportFailure {
    rowNumber: number
    reasons: string[]
}

export interface MemberImportRequestRow {
    rowNumber: number
    member: MemberInput
}

export interface MemberCatalogOption<T extends string = string> {
    value: T
    label: string
    code?: string
}

export interface MemberZoneCatalogOption extends MemberCatalogOption {
    districtCode: string
}

export interface MemberSectorCatalogOption extends MemberCatalogOption {
    zoneCode: string
}

export interface MemberDepartmentCatalogOption extends MemberCatalogOption {
    countryCode: string
}

export interface MemberMunicipalityCatalogOption extends MemberCatalogOption {
    departmentCode: string
}

export interface MemberCatalogs {
    statuses: MemberCatalogOption<MemberStatus>[]
    genders: MemberCatalogOption<MemberGender>[]
    maritalStatuses: MemberCatalogOption<MemberMaritalStatus>[]
    countries: MemberCatalogOption[]
    departments: MemberDepartmentCatalogOption[]
    municipalities: MemberMunicipalityCatalogOption[]
    roles: MemberCatalogOption<MemberCommunityRole>[]
    ministries: MemberCatalogOption[]
    districts: MemberCatalogOption[]
    zones: MemberZoneCatalogOption[]
    sectors: MemberSectorCatalogOption[]
}
