export type MeetingFrequencyValue = 'unica' | 'diaria' | 'semanal' | 'quincenal' | 'mensual'
export type MeetingStatusValue = 'programada' | 'en_curso' | 'completada' | 'cancelada'

export interface CreateMeetingDto {
    typeId: number
    sectorId: number
    leaderId: number
    supervisorId: number
    coSupervisorIds: number[]
    title: string
    description: string | null
    date: string // YYYY-MM-DD
    recurrenceEndDate: string | null // YYYY-MM-DD; null = sin finalización
    startTime: string // HH:mm
    endTime: string // HH:mm
    location: string
    latitude: number | null
    longitude: number | null
    frequency: MeetingFrequencyValue
    expectedAttendees: number
    status: MeetingStatusValue
    isPublic: boolean
    notes: string | null
    color: string
}

export type UpdateMeetingDto = Partial<CreateMeetingDto>

export interface CreateMeetingTypeDto {
    code: string
    name: string
    description: string | null
    color: string
    isActive: boolean
}

export type UpdateMeetingTypeDto = Partial<CreateMeetingTypeDto>
