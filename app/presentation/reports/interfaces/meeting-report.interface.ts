export type ReportReceptionStatus = 'cuadra' | 'con_diferencia'

export type ReportReceptionState = 'cuadra' | 'diferencia_abierta' | 'diferencia_cerrada'

export type ReportRowSource = 'reunion' | 'diezmo'

export interface ReportOffering {
    categoryId: number
    amount: number
}

export interface MeetingReportRow {
    key: string
    source: ReportRowSource
    id: number
    occurrenceId: number | null
    meetingId: number | null
    meetingCode: string | null
    meetingTitle: string | null
    meetingColor: string | null
    meetingTypeId: number | null
    meetingTypeName: string | null
    isGeneral: boolean
    isMeetingActive: boolean
    date: string
    startTime: string | null
    endTime: string | null
    districtId: number | null
    districtName: string | null
    zoneId: number | null
    zoneName: string | null
    sectorId: number | null
    sectorName: string | null
    leaderName: string | null
    titherId: number | null
    titherCode: string | null
    titherName: string | null
    notes: string | null
    receivedAmount: number
    uncategorizedAmount: number
    offerings: ReportOffering[]
    status: ReportReceptionStatus | null
    isClosed: boolean
    directEntry: boolean
    receivedByName: string | null
    receivedAt: string
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

export type ReportMeetingKind = 'celulas' | 'generales' | 'diezmos'

export type ReportStateFilter = 'todas' | ReportReceptionState

export interface MeetingReportFilters {
    kinds: ReportMeetingKind[]
    state: ReportStateFilter
    meetingTypeIds: number[]
    districtId: number | null
    zoneId: number | null
    sectorId: number | null
}

export interface ReportSummary {
    meetingCount: number
    envelopeCount: number
    meetingEnvelopeCount: number
    totalReceived: number
    meetingTotal: number
    averagePerEnvelope: number
    averagePerMeeting: number
    balancedCount: number
    openDiscrepancyCount: number
    closedDiscrepancyCount: number
    directEntryCount: number
    balancedRate: number | null
    titheCount: number
    titherCount: number
    titheTotal: number
    averagePerTither: number
    averagePerTithe: number
    largestTithe: number
}

export interface MeetingReportAggregate {
    key: string
    source: ReportRowSource
    meetingId: number | null
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
    envelopeCount: number
    openDiscrepancyCount: number
    categoryAmounts: Record<number, number>
    uncategorizedAmount: number
    titheAmount: number
    totalReceived: number
    averagePerEnvelope: number
    share: number
    firstDate: string
    lastDate: string
}

export interface TitherReportAggregate {
    key: string
    titherId: number
    titherCode: string
    titherName: string
    isGeneral: boolean
    districtName: string | null
    zoneName: string | null
    sectorName: string | null
    envelopeCount: number
    totalReceived: number
    averagePerEnvelope: number
    titheShare: number
    share: number
    firstDate: string
    lastDate: string
}

export interface DistrictReportAggregate {
    key: string
    districtName: string
    meetingCount: number
    titherCount: number
    envelopeCount: number
    totalReceived: number
    averagePerEnvelope: number
    share: number
}

export interface CategoryReportTotal {
    id: number | 'uncategorized' | 'tithes'
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
    received: ReportTrendPoint[]
}
