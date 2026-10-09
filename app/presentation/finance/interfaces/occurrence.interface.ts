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

export interface OccurrenceRecord {
    id: number
    meetingId: number
    meetingTitle: string
    meetingCode: string
    meetingTypeName: string | null
    meetingColor: string
    startTime: string
    endTime: string
    date: string
    status: OccurrenceStatus
    isRecordable?: boolean
    attendance: number | null
    attendanceDetails: AttendanceDetail[]
    totalAmount: number | null
    currency: string
    notes: string | null
    sectorId: number | null
    sectorName: string | null
    zoneId: number | null
    zoneName: string | null
    districtId: number | null
    districtName: string | null
    leaderId: number | null
    leaderName: string | null
    recordedById: number | null
    recordedByName: string | null
    recordedByUsername: string | null
    recordedByEmail: string | null
    recordedAt: string | null
    updatedById: number | null
    updatedByName: string | null
    updatedByUsername: string | null
    updatedByEmail: string | null
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

export type OccurrenceDateField = 'reunion' | 'registro'

export interface OccurrenceFilters {
    meetingId?: number
    status?: OccurrenceStatus
    from?: string
    to?: string
    dateField?: OccurrenceDateField
}

export interface PendingGroup {
    meetingId: number
    meetingTitle: string
    meetingCode: string
    meetingColor: string
    meetingTypeName: string | null
    sectorName: string | null
    zoneName: string | null
    districtName: string | null
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
