export interface OccurrenceDetailDto {
    categoryId: number
    amount: number
    notes: string | null
}

/// Captura de una ocurrencia pendiente: asistencia más el desglose de la ofrenda.
export interface RecordOccurrenceDto {
    attendance: number
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
