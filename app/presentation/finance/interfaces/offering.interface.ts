export interface OfferingDetail {
    id: number
    categoryId: number
    categoryName: string | null
    amount: number
    notes: string | null
}

export interface OfferingRecord {
    id: number
    meetingId: number
    meetingTitle: string | null
    date: string
    attendance: number
    totalAmount: number
    currency: string
    notes: string | null
    recordedById: number | null
    recordedByName: string | null
    details: OfferingDetail[]
    createdAt: string
    updatedAt: string
}

export interface OfferingDetailInput {
    categoryId: number
    amount: number
    notes: string | null
}

export interface OfferingInput {
    meetingId: number
    date: string
    attendance: number
    currency: string
    notes: string | null
    details: OfferingDetailInput[]
}

export interface OfferingCategoryOption {
    id: number
    code: string
    name: string
    description: string | null
    sortOrder: number
    isActive: boolean
}

export interface MeetingOption {
    id: number
    title: string
    date: string
    sectorName: string | null
    color: string
}
