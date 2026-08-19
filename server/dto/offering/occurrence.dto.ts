export interface OccurrenceDetailDto {
    categoryId: number
    amount: number
    notes: string | null
}

export interface AttendanceDetailInputDto {
    typeId: number
    quantity: number
}

/// Captura de una ocurrencia: asistencia y ofrenda, cada una con su desglose.
export interface RecordOccurrenceDto {
    /// Total de personas. Si viene desglose, se calcula de él y este valor se ignora.
    attendance: number
    attendanceDetails: AttendanceDetailInputDto[]
    /// Ofrenda global cuando no se desglosa por categoría; si hay desglose, se calcula de él.
    totalAmount: number | null
    currency: string
    notes: string | null
    details: OccurrenceDetailDto[]
}

/// Corrección de una ocurrencia ya registrada.
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

/// Alcance de visibilidad ya resuelto para el usuario autenticado.
export interface OccurrenceScopeFilter {
    seesAll: boolean
    sectorIds: number[]
    meetingIds: number[]
}
