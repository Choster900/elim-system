export type MeetingFrequency = 'unica' | 'semanal' | 'quincenal' | 'mensual'
export type MeetingStatus = 'programada' | 'en_curso' | 'completada' | 'cancelada'

export interface MeetingRecord {
    id: number
    typeId: number
    sectorId: number
    supervisorId: number
    coSupervisorIds: number[]
    title: string
    description: string | null
    date: string
    startTime: string
    endTime: string
    location: string
    latitude: number | null
    longitude: number | null
    frequency: MeetingFrequency
    expectedAttendees: number
    status: MeetingStatus
    isPublic: boolean
    notes: string | null
    color: string
    typeName: string | null
    typeColor: string | null
    sectorName: string | null
    supervisorName: string | null
    createdAt: string
    updatedAt: string
}

export interface MeetingInput {
    typeId: number
    sectorId: number
    supervisorId: number
    coSupervisorIds: number[]
    title: string
    description: string | null
    date: string
    startTime: string
    endTime: string
    location: string
    latitude: number | null
    longitude: number | null
    frequency: MeetingFrequency
    expectedAttendees: number
    status: MeetingStatus
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
}
