export type OccurrenceStatus = 'pendiente' | 'registrada'

export interface OccurrenceDetail {
    id: number
    categoryId: number
    categoryName: string | null
    amount: number
    notes: string | null
}

/// Una fecha concreta en que la reunión debía realizarse.
export interface OccurrenceRecord {
    id: number
    meetingId: number
    meetingTitle: string
    meetingTypeName: string | null
    meetingColor: string
    startTime: string
    date: string
    status: OccurrenceStatus
    attendance: number | null
    totalAmount: number | null
    currency: string
    notes: string | null
    sectorId: number
    sectorName: string
    zoneId: number
    zoneName: string
    districtId: number
    districtName: string
    leaderId: number | null
    leaderName: string | null
    recordedById: number | null
    recordedByName: string | null
    recordedAt: string | null
    updatedById: number | null
    updatedByName: string | null
    details: OccurrenceDetail[]
    createdAt: string
    updatedAt: string
}

export interface OccurrenceDetailInput {
    categoryId: number
    amount: number
    notes: string | null
}

export interface RecordOccurrenceInput {
    attendance: number
    totalAmount: number | null
    currency: string
    notes: string | null
    details: OccurrenceDetailInput[]
}

export interface BulkRecordEntry extends RecordOccurrenceInput {
    occurrenceId: number
}

export interface OccurrenceFilters {
    meetingId?: number
    status?: OccurrenceStatus
    from?: string
    to?: string
}

/// Pendientes de una misma reunión, agrupados para la bandeja.
export interface PendingGroup {
    meetingId: number
    meetingTitle: string
    meetingColor: string
    meetingTypeName: string | null
    sectorName: string
    zoneName: string
    districtName: string
    leaderName: string | null
    startTime: string
    occurrences: OccurrenceRecord[]
    oldestDate: string
    daysBehind: number
}

export interface OfferingCategoryOption {
    id: number
    code: string
    name: string
    description: string | null
    sortOrder: number
    isActive: boolean
}
