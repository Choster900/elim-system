export interface TitheFiltersDto {
    from?: string
    to?: string
}

export interface SaveTitheDto {
    memberId: number
    amount: number
    date: string
    notes: string | null
}
