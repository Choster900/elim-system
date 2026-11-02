export type ReportOccurrenceStatus = 'registrada' | 'pendiente'

export type ReportReceptionStatus = 'cuadra' | 'con_diferencia'

export interface ReportOffering {
    categoryId: number
    amount: number
}

export interface ReportReception {
    status: ReportReceptionStatus
    receivedAmount: number
    difference: number
    directEntry: boolean
    isClosed: boolean
    receivedAt: string
}

export interface MeetingReportRow {
    id: number
    meetingId: number
    meetingCode: string
    meetingTitle: string
    meetingColor: string
    meetingTypeId: number
    meetingTypeName: string
    isGeneral: boolean
    isMeetingActive: boolean
    date: string
    startTime: string
    endTime: string
    status: ReportOccurrenceStatus
    districtId: number | null
    districtName: string | null
    zoneId: number | null
    zoneName: string | null
    sectorId: number | null
    sectorName: string | null
    leaderName: string | null
    attendance: number | null
    totalAmount: number | null
    uncategorizedAmount: number
    offerings: ReportOffering[]
    reception: ReportReception | null
    recordedByName: string | null
    recordedAt: string | null
}

export interface ReportCategory {
    id: number
    code: string
    name: string
    isActive: boolean
    sortOrder: number
}

export interface MeetingReport {
    from: string
    to: string
    generatedAt: string
    currency: string
    categories: ReportCategory[]
    rows: MeetingReportRow[]
}

export interface ReportDateRange {
    from: string
    to: string
}

export type ReportMeetingKind = 'todas' | 'celulas' | 'generales'

export type ReportStatusFilter = 'todas' | ReportOccurrenceStatus

export interface MeetingReportFilters {
    kind: ReportMeetingKind
    status: ReportStatusFilter
    meetingTypeIds: number[]
    districtId: number | null
    zoneId: number | null
    sectorId: number | null
}

export interface ReportSummary {
    meetingCount: number
    occurrenceCount: number
    recordedCount: number
    pendingCount: number
    complianceRate: number | null
    totalOfferings: number
    averagePerOccurrence: number
    averagePerMeeting: number
    totalAttendance: number
    averageAttendance: number
    offeringPerAttendee: number
    receivedCount: number
    receivedAmount: number
    receivedDifference: number
    discrepancyCount: number
    unreceivedCount: number
}

export interface MeetingReportAggregate {
    meetingId: number
    meetingCode: string
    meetingTitle: string
    meetingColor: string
    meetingTypeName: string
    isGeneral: boolean
    isMeetingActive: boolean
    districtName: string | null
    zoneName: string | null
    sectorName: string | null
    leaderName: string | null
    occurrenceCount: number
    recordedCount: number
    pendingCount: number
    attendance: number
    averageAttendance: number
    categoryAmounts: Record<number, number>
    uncategorizedAmount: number
    totalOfferings: number
    averageOffering: number
    share: number
    receivedAmount: number
    receivedDifference: number
    firstDate: string
    lastDate: string
    lastRecordedDate: string | null
}

export interface DistrictReportAggregate {
    key: string
    districtName: string
    meetingCount: number
    occurrenceCount: number
    recordedCount: number
    pendingCount: number
    attendance: number
    averageAttendance: number
    totalOfferings: number
    averageOffering: number
    share: number
    receivedAmount: number
    receivedDifference: number
}

export interface CategoryReportTotal {
    id: number | 'uncategorized'
    name: string
    amount: number
    share: number
}

export interface ReportTrendPoint {
    key: string
    label: string
    value: number
    detail?: string[]
}

export type ReportTrendGranularity = 'day' | 'week' | 'month'

export interface ReportTrend {
    granularity: ReportTrendGranularity
    offerings: ReportTrendPoint[]
    attendance: ReportTrendPoint[]
}
