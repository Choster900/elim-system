export type DashboardPeriodDays = 30 | 90 | 365

export interface DashboardMetric {
    value: number
    previousValue: number
    changePercentage: number | null
}

export interface DashboardTrendPoint {
    key: string
    label: string
    attendance: number
    offerings: number
    meetingCount: number
}

export interface DashboardDistribution {
    id: number
    name: string
    value: number
    percentage: number
}

export interface DashboardDistrict {
    id: number
    name: string
    attendance: number
    offerings: number
    meetingCount: number
    averageAttendance: number
}

export interface DashboardRecentOffering {
    id: number
    meetingId: number
    meetingTitle: string
    districtName: string
    date: string
    attendance: number
    totalAmount: number
    currency: string
}

export interface DashboardUpcomingMeeting {
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

export interface DashboardSummary {
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
        newMembers: DashboardMetric
        attendance: DashboardMetric
        offerings: DashboardMetric
        registeredMeetings: DashboardMetric
        averageAttendance: number
        averageOffering: number
        attendanceGoalRate: number
        offeringPerAttendee: number
    }
    trends: DashboardTrendPoint[]
    categoryDistribution: DashboardDistribution[]
    districtPerformance: DashboardDistrict[]
    recentOfferings: DashboardRecentOffering[]
    upcomingMeetings: DashboardUpcomingMeeting[]
}
