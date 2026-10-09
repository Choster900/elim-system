export type ReceptionStatus = 'cuadra' | 'con_diferencia'

export type DenominationKind = 'billete' | 'moneda'

export interface Denomination {
    id: number
    code: string
    name: string
    value: number
    kind: DenominationKind
    sortOrder: number
    isActive: boolean
}

export interface EnvelopeCategory {
    categoryId: number | null
    categoryName: string | null
}

export interface Envelope {
    isGeneral: boolean
    directEntry: boolean
    isReady: boolean
    occurrenceId: number
    meetingId: number
    meetingTitle: string
    meetingCode: string
    meetingColor: string
    meetingTypeName: string | null
    date: string
    startTime: string
    endTime: string
    leaderName: string | null
    sectorId: number | null
    sectorName: string | null
    zoneId: number | null
    zoneName: string | null
    districtId: number | null
    districtName: string | null
    recordedByName: string | null
    recordedAt: string | null
    categories: EnvelopeCategory[]
}

export interface ReceptionCount {
    denomination: Denomination
    quantity: number
    amount: number
}

export interface ReceptionCategoryResult {
    categoryId: number | null
    categoryName: string | null
    registeredAmount: number
    countedAmount: number
    difference: number
    counts: ReceptionCount[]
}

export interface ReceptionComparison {
    status: ReceptionStatus
    registeredAmount: number
    countedAmount: number
    difference: number
    categories: ReceptionCategoryResult[]
}

export interface ReceptionRecord extends ReceptionComparison {
    id: number
    occurrenceId: number
    currency: string
    notes: string | null
    receivedById: number | null
    receivedByName: string | null
    receivedAt: string
    reviewedById: number | null
    reviewedByName: string | null
    reviewedAt: string | null
    closedById: number | null
    closedByName: string | null
    closedAt: string | null
    closingNotes: string | null
    directEntry: boolean
    envelope: Envelope
}

export interface EnvelopeDetail {
    envelope: Envelope
    reception: ReceptionRecord | null
    availableCategories: EnvelopeCategory[]
}

export interface ReceptionCountInput {
    categories: {
        categoryId: number | null
        counts: { denominationId: number; quantity: number }[]
    }[]
}

export interface ReceiveEnvelopeInput extends ReceptionCountInput {
    notes: string | null
}

export interface PendingEnvelopesParams {
    page: number
    limit: number
    search?: string
    zoneId?: number
}

export interface PendingEnvelopesPage {
    items: Envelope[]
    zones: { id: number; name: string }[]
    pagination: {
        page: number
        limit: number
        totalItems: number
        totalPages: number
        hasNextPage: boolean
        hasPreviousPage: boolean
    }
}

export interface ReceptionFilters {
    status?: ReceptionStatus
    from?: string
    to?: string
}
