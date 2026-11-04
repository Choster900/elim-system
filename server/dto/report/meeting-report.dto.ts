export interface MeetingReportQueryDto {
    from: string
    to: string
}

export type MeetingReportReceptionStatus = 'cuadra' | 'con_diferencia'

export type MeetingReportSource = 'reunion' | 'diezmo'

export interface MeetingReportOfferingDto {
    categoryId: number
    amount: number
}

export interface MeetingReportRowDto {
    key: string
    source: MeetingReportSource
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
    offerings: MeetingReportOfferingDto[]
    status: MeetingReportReceptionStatus | null
    isClosed: boolean
    directEntry: boolean
    receivedByName: string | null
    receivedAt: string
}

export interface MeetingReportCategoryDto {
    id: number
    code: string
    name: string
    isActive: boolean
    sortOrder: number
}

export interface MeetingReportDto {
    from: string
    to: string
    generatedAt: string
    currency: string
    categories: MeetingReportCategoryDto[]
    rows: MeetingReportRowDto[]
}
