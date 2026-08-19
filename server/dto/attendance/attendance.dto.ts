export interface CreateAttendanceTypeDto {
    code: string
    name: string
    description: string | null
    sortOrder: number
    isActive: boolean
}

export type UpdateAttendanceTypeDto = Partial<CreateAttendanceTypeDto>

/// Cuántas personas de un tipo asistieron a una fecha.
export interface AttendanceDetailDto {
    typeId: number
    quantity: number
}
