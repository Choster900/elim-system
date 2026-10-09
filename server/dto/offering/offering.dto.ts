export interface CreateOfferingCategoryDto {
    code: string
    name: string
    description: string | null
    sortOrder: number
    isActive: boolean
}

export type UpdateOfferingCategoryDto = Partial<CreateOfferingCategoryDto>
