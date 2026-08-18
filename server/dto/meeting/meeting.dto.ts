export type MeetingFrequencyValue = 'unica' | 'diaria' | 'semanal' | 'quincenal' | 'mensual'
export type MonthlyModeValue = 'dia_fijo' | 'ordinal'

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
    /// Solo aplica cuando la frecuencia es mensual.
    monthlyMode: MonthlyModeValue | null
    /// 1 a 4, o 5 para el último; solo en modo ordinal.
    weekOrdinal: number | null
    /// 0 domingo a 6 sábado; solo en modo ordinal.
    weekday: number | null
    expectedAttendees: number
    /// Una reunión inactiva deja de generar ocurrencias pendientes.
    isActive: boolean
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
