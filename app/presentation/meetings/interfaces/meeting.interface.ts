export type MeetingFrequency = 'unica' | 'diaria' | 'semanal' | 'quincenal' | 'mensual'
export type MonthlyMode = 'dia_fijo' | 'ordinal'

export interface MeetingRecord {
    id: number
    /// Autogenerado por el servidor: SECNNN-REUNNNN-AAAAMMDD.
    code: string
    typeId: number
    sectorId: number
    leaderId: number
    supervisorId: number
    coSupervisorIds: number[]
    title: string
    description: string | null
    date: string
    recurrenceEndDate: string | null
    startTime: string
    endTime: string
    location: string
    latitude: number | null
    longitude: number | null
    frequency: MeetingFrequency
    monthlyMode: MonthlyMode | null
    weekOrdinal: number | null
    weekday: number | null
    expectedAttendees: number
    isActive: boolean
    isPublic: boolean
    notes: string | null
    color: string
    typeName: string | null
    typeColor: string | null
    sectorName: string | null
    zoneId: number
    zoneName: string
    districtId: number
    districtName: string
    leaderName: string | null
    supervisorName: string | null
    createdAt: string
    updatedAt: string
}

export interface MeetingInput {
    typeId: number
    sectorId: number
    leaderId: number
    supervisorId: number
    coSupervisorIds: number[]
    title: string
    description: string | null
    date: string
    recurrenceEndDate: string | null
    startTime: string
    endTime: string
    location: string
    latitude: number | null
    longitude: number | null
    frequency: MeetingFrequency
    monthlyMode: MonthlyMode | null
    weekOrdinal: number | null
    weekday: number | null
    expectedAttendees: number
    isActive: boolean
    isPublic: boolean
    notes: string | null
    color: string
}

export interface MeetingTypeOption {
    id: number
    code: string
    name: string
    description: string | null
    color: string
    isActive: boolean
}

export interface MemberOption {
    id: number
    code: string
    fullName: string
    email: string | null
    phone: string | null
    status: string
}

export interface SectorOption {
    id: number
    name: string
    code: string
    polygon: [number, number][]
    supervisorId: number | null
    supervisorName: string | null
}
