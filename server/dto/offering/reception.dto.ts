export type ReceptionStatus = 'cuadra' | 'con_diferencia'

export interface ReceptionCountInputDto {
    denominationId: number
    quantity: number
}

export interface ReceptionCategoryInputDto {
    categoryId: number | null
    counts: ReceptionCountInputDto[]
    amount?: number
}

export interface ReceptionCountDto {
    categories: ReceptionCategoryInputDto[]
}

export interface ReceiveEnvelopeDto extends ReceptionCountDto {
    notes: string | null
}

export type PendingEnvelopesDateField = 'reunion' | 'registro'

export type PendingEnvelopesKind = 'lideres' | 'generales'

export interface PendingEnvelopesFiltersDto {
    kind?: PendingEnvelopesKind
    order?: 'asc' | 'desc'
    search?: string
    districtId?: number
    zoneId?: number
    sectorId?: number
    dateField?: PendingEnvelopesDateField
    from?: string
    to?: string
}

export interface ReceptionFiltersDto {
    status?: ReceptionStatus
    from?: string
    to?: string
}

export interface ReceptionCountWriteDto {
    denominationId: number
    quantity: number
    amount: number
}

export interface ReceptionCategoryWriteDto {
    categoryId: number | null
    systemAmount: number
    amount: number
    counts: ReceptionCountWriteDto[]
}

export interface ReceptionWriteDto {
    systemAmount: number
    receivedAmount: number
    amountDifference: number
    status: ReceptionStatus
    notes: string | null
    categories: ReceptionCategoryWriteDto[]
}
