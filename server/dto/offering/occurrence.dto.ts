export interface OccurrenceDetailDto {
    categoryId: number
    amount: number
    notes: string | null
}

export interface AttendanceDetailInputDto {
    typeId: number
    quantity: number
}

export interface RecordOccurrenceDto {
    attendance: number
    attendanceDetails: AttendanceDetailInputDto[]
    totalAmount: number | null
    currency: string
    notes: string | null
    details: OccurrenceDetailDto[]
}

export type UpdateOccurrenceDto = Partial<RecordOccurrenceDto>

export interface BulkRecordEntryDto extends RecordOccurrenceDto {
    occurrenceId: number
}

export interface BulkRecordOccurrencesDto {
    entries: BulkRecordEntryDto[]
}

export interface OccurrenceFiltersDto {
    meetingId?: number
    status?: 'pendiente' | 'registrada'
    from?: string
    to?: string
}

export interface OccurrenceScopeFilter {
    seesAll: boolean
    sectorIds: number[]
    meetingIds: number[]
}
