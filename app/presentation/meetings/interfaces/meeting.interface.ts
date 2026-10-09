export type MeetingFrequency = 'unica' | 'diaria' | 'semanal' | 'quincenal' | 'mensual'
export type MonthlyMode = 'dia_fijo' | 'ordinal'

export interface MeetingRecord {
    id: number
    code: string
    fullCode: string
    typeId: number
    sectorId: number | null
    leaderId: number | null
    supervisorId: number | null
    hostId: number | null
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
    isGeneral: boolean
    sectorName: string | null
    zoneId: number | null
    zoneName: string | null
    districtId: number | null
    districtName: string | null
    leaderName: string | null
    supervisorName: string | null
    hostName: string | null
    createdAt: string
    updatedAt: string
}

export interface MeetingInput {
    typeId: number
    sectorId: number | null
    leaderId: number | null
    supervisorId: number | null
    hostId: number | null
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
    codeSegment: string
    name: string
    description: string | null
    color: string
    isActive: boolean
    isGeneral: boolean
}

export interface MemberOption {
    id: number
    code: string
    fullName: string
    documentNumber: string | null
    email: string | null
    phone: string | null
    status: string
}

export interface SectorOption {
    id: number
    name: string
    code: string
    pathCode: string
    zoneCode: string
    districtCode: string
    zoneName: string
    districtName: string
    polygon: [number, number][]
    supervisorId: number | null
    supervisorName: string | null
}
