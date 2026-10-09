export type MeetingFrequencyValue = 'unica' | 'diaria' | 'semanal' | 'quincenal' | 'mensual'
export type MonthlyModeValue = 'dia_fijo' | 'ordinal'

export interface CreateMeetingDto {
    typeId: number
    sectorId: number | null
    leaderId: number | null
    supervisorId: number | null
    hostId: number | null
    coSupervisorIds: number[]
    title: string | null
    description: string | null
    date: string
    recurrenceEndDate: string | null
    startTime: string
    endTime: string
    location: string
    latitude: number | null
    longitude: number | null
    frequency: MeetingFrequencyValue
    monthlyMode: MonthlyModeValue | null
    weekOrdinal: number | null
    weekday: number | null
    expectedAttendees: number
    isActive: boolean
    isPublic: boolean
    notes: string | null
    color: string
}

export type UpdateMeetingDto = Partial<CreateMeetingDto>

export interface CreateMeetingTypeDto {
    codeSegment: string
    name: string
    isActive: boolean
    isGeneral: boolean
}

export type UpdateMeetingTypeDto = Partial<CreateMeetingTypeDto>
