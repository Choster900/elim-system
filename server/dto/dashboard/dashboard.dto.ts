export type DashboardPeriodDays = 30 | 90 | 365

export interface DashboardQueryDto {
    periodDays: DashboardPeriodDays
    districtId?: number
}

export interface DashboardMetricDto {
    value: number
    previousValue: number
    changePercentage: number | null
}

export interface DashboardTrendPointDto {
    key: string
    label: string
    attendance: number
    offerings: number
    meetingCount: number
}

export interface DashboardDistributionDto {
    id: number
    name: string
    value: number
    percentage: number
}

export interface DashboardDistrictDto {
    id: number
    name: string
    attendance: number
    offerings: number
    meetingCount: number
    averageAttendance: number
}

export interface DashboardRecentOfferingDto {
    id: number
    meetingId: number
    meetingTitle: string
    districtName: string
    date: string
    attendance: number
    totalAmount: number
    currency: string
}

export interface DashboardUpcomingMeetingDto {
    id: number
    title: string
    typeName: string
    districtName: string
    sectorName: string
    occurrenceDate: string
    startTime: string
    location: string
    expectedAttendees: number
    color: string
}

export interface DashboardSummaryDto {
    generatedAt: string
    period: {
        days: DashboardPeriodDays
        startDate: string
        endDate: string
        previousStartDate: string
        previousEndDate: string
    }
    filters: {
        selectedDistrictId: number | null
        districts: Array<{ id: number; name: string }>
    }
    metrics: {
        activeMembers: number
        newMembers: DashboardMetricDto
        attendance: DashboardMetricDto
        offerings: DashboardMetricDto
        registeredMeetings: DashboardMetricDto
        averageAttendance: number
        averageOffering: number
        attendanceGoalRate: number
        offeringPerAttendee: number
        /// Porcentaje de fechas esperadas que ya fueron registradas en el período.
        recordingCoverage: number
        /// Fechas del período que siguen sin registrar.
        pendingOccurrences: number
    }
    trends: DashboardTrendPointDto[]
    categoryDistribution: DashboardDistributionDto[]
    districtPerformance: DashboardDistrictDto[]
    recentOfferings: DashboardRecentOfferingDto[]
    upcomingMeetings: DashboardUpcomingMeetingDto[]
}
