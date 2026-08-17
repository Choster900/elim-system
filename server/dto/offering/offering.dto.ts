export interface OfferingDetailDto {
    categoryId: number
    amount: number
    notes: string | null
}

export interface CreateOfferingDto {
    meetingId: number
    date: string // YYYY-MM-DD
    attendance: number
    currency: string
    notes: string | null
    details: OfferingDetailDto[]
}

export interface CreateOfferingsBulkDto {
    offerings: CreateOfferingDto[]
}

export type UpdateOfferingDto = Partial<CreateOfferingDto>

export interface CreateOfferingCategoryDto {
    code: string
    name: string
    description: string | null
    sortOrder: number
    isActive: boolean
}

export type UpdateOfferingCategoryDto = Partial<CreateOfferingCategoryDto>
