export type ReconciliationStatus =
    'cuadra' | 'diferencia_abierta' | 'diferencia_cerrada' | 'sin_entregar'

export interface ReconciliationFiltersDto {
    kind: 'reuniones' | 'generales'
    from?: string
    to?: string
    zoneId?: number
    sectorId?: number
}

export interface ReconciliationPeriodDto {
    from: string
    to: string
    zoneId?: number
    sectorId?: number
}

export interface CloseDiscrepancyDto {
    notes: string
}
