export interface CreateAttendanceTypeDto {
    code: string
    name: string
    groupId: number | null
    description: string | null
    sortOrder: number
    isActive: boolean
}

export type UpdateAttendanceTypeDto = Partial<CreateAttendanceTypeDto>

export interface AttendanceDetailDto {
    typeId: number
    quantity: number
}
