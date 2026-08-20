export type OccurrenceStatus = 'pendiente' | 'registrada'

export interface AttendanceTypeOption {
    id: number
    code: string
    name: string
    description: string | null
    sortOrder: number
    isActive: boolean
}

export interface AttendanceDetail {
    id: number
    typeId: number
    typeName: string | null
    quantity: number
}

export interface AttendanceDetailInput {
    typeId: number
    quantity: number
}

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
    /// Código autogenerado de la reunión: SECNNN-REUNNNN-AAAAMMDD.
    meetingCode: string
    meetingTypeName: string | null
    meetingColor: string
    startTime: string
    endTime: string
    date: string
    status: OccurrenceStatus
    attendance: number | null
    attendanceDetails: AttendanceDetail[]
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
    attendanceDetails: AttendanceDetailInput[]
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
    meetingCode: string
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
