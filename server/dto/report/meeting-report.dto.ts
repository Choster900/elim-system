export interface MeetingReportQueryDto {
    from: string
    to: string
}

export type MeetingReportOccurrenceStatus = 'registrada' | 'pendiente'

export type MeetingReportReceptionStatus = 'cuadra' | 'con_diferencia'

export interface MeetingReportOfferingDto {
    categoryId: number
    amount: number
}

export interface MeetingReportReceptionDto {
    status: MeetingReportReceptionStatus
    receivedAmount: number
    difference: number
    directEntry: boolean
    isClosed: boolean
    receivedAt: string
}

export interface MeetingReportRowDto {
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
    status: MeetingReportOccurrenceStatus
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
    offerings: MeetingReportOfferingDto[]
    reception: MeetingReportReceptionDto | null
    recordedByName: string | null
    recordedAt: string | null
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
