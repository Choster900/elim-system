import type {
    DashboardDistributionDto,
    DashboardMetricDto,
    DashboardQueryDto,
    DashboardSummaryDto,
    DashboardTrendPointDto,
    DashboardUpcomingMeetingDto,
} from '../dto/dashboard/dashboard.dto'
import { findDashboardData } from '../repositories/dashboard.repository'

const DAY_MS = 24 * 60 * 60 * 1000
const TREND_BUCKETS = 6

function startOfUtcDay(value: Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function addUtcDays(value: Date, days: number) {
    return new Date(value.getTime() + days * DAY_MS)
}

function toIsoDate(value: Date) {
    return value.toISOString().slice(0, 10)
}

function round2(value: number) {
    return Math.round(value * 100) / 100
}

function percentageChange(current: number, previous: number) {
    if (previous === 0) return current === 0 ? 0 : null
    return round2(((current - previous) / previous) * 100)
}

function metric(current: number, previous: number): DashboardMetricDto {
    return {
        value: round2(current),
        previousValue: round2(previous),
        changePercentage: percentageChange(current, previous),
    }
}

function formatTrendLabel(value: Date, periodDays: number) {
    return new Intl.DateTimeFormat('es-SV', {
        day: periodDays === 365 ? undefined : '2-digit',
        month: 'short',
        timeZone: 'UTC',
    })
        .format(value)
        .replace('.', '')
}

function createTrend(
    currentOfferings: Array<{ date: Date; attendance: number; totalAmount: unknown }>,
    currentStart: Date,
    periodDays: number,
) {
    const buckets: DashboardTrendPointDto[] = Array.from({ length: TREND_BUCKETS }, (_, index) => {
        const offset = Math.floor((index * periodDays) / TREND_BUCKETS)
        const bucketDate = addUtcDays(currentStart, offset)
        return {
            key: toIsoDate(bucketDate),
            label: formatTrendLabel(bucketDate, periodDays),
            attendance: 0,
            offerings: 0,
            meetingCount: 0,
        }
    })

    for (const offering of currentOfferings) {
        const dayOffset = Math.max(
            0,
            Math.floor((startOfUtcDay(offering.date).getTime() - currentStart.getTime()) / DAY_MS),
        )
        const bucketIndex = Math.min(
            TREND_BUCKETS - 1,
            Math.floor((dayOffset * TREND_BUCKETS) / periodDays),
        )
        const bucket = buckets[bucketIndex]
        if (!bucket) continue
        bucket.attendance += offering.attendance
        bucket.offerings = round2(bucket.offerings + Number(offering.totalAmount))
        bucket.meetingCount += 1
    }

    return buckets
}

function buildCategoryDistribution(
    offerings: Array<{
        details: Array<{ amount: unknown; category: { id: number; name: string } }>
    }>,
) {
    const totals = new Map<number, { name: string; value: number }>()
    for (const offering of offerings) {
        for (const detail of offering.details) {
            const current = totals.get(detail.category.id) ?? {
                name: detail.category.name,
                value: 0,
            }
            current.value += Number(detail.amount)
            totals.set(detail.category.id, current)
        }
    }

    const total = [...totals.values()].reduce((sum, item) => sum + item.value, 0)
    return [...totals]
        .map<DashboardDistributionDto>(([id, item]) => ({
            id,
            name: item.name,
            value: round2(item.value),
            percentage: total > 0 ? round2((item.value / total) * 100) : 0,
        }))
        .sort((left, right) => right.value - left.value)
}

function nextOccurrence(
    meeting: {
        date: Date
        recurrenceEndDate: Date | null
        frequency: string
    },
    today: Date,
) {
    const anchor = startOfUtcDay(meeting.date)
    const recurrenceEnd = meeting.recurrenceEndDate
        ? startOfUtcDay(meeting.recurrenceEndDate)
        : null
    let occurrence: Date | null = null

    if (meeting.frequency === 'ONCE') {
        occurrence = anchor >= today ? anchor : null
    } else if (meeting.frequency === 'MONTHLY') {
        const anchorDay = anchor.getUTCDate()
        const monthCandidate = (year: number, month: number) => {
            const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
            return new Date(Date.UTC(year, month, Math.min(anchorDay, lastDay)))
        }
        occurrence = monthCandidate(today.getUTCFullYear(), today.getUTCMonth())
        if (occurrence < today) {
            occurrence = monthCandidate(today.getUTCFullYear(), today.getUTCMonth() + 1)
        }
        if (occurrence < anchor) occurrence = anchor
    } else {
        const intervalDays =
            meeting.frequency === 'DAILY' ? 1 : meeting.frequency === 'BIWEEKLY' ? 14 : 7
        const elapsedDays = Math.max(0, Math.floor((today.getTime() - anchor.getTime()) / DAY_MS))
        const intervals = Math.ceil(elapsedDays / intervalDays)
        occurrence = addUtcDays(anchor, intervals * intervalDays)
        if (occurrence < today) occurrence = addUtcDays(occurrence, intervalDays)
    }

    if (occurrence && recurrenceEnd && occurrence > recurrenceEnd) return null
    return occurrence
}

function buildUpcomingMeetings(
    meetings: Array<{
        id: number
        title: string
        date: Date
        recurrenceEndDate: Date | null
        frequency: string
        startTime: Date
        location: string
        expectedAttendees: number
        color: string
        type: { name: string }
        sector: {
            name: string
            zone: { district: { name: string } }
        }
    }>,
    today: Date,
) {
    return meetings
        .map((meeting): DashboardUpcomingMeetingDto | null => {
            const occurrence = nextOccurrence(meeting, today)
            if (!occurrence) return null

            return {
                id: meeting.id,
                title: meeting.title,
                typeName: meeting.type.name,
                districtName: meeting.sector.zone.district.name,
                sectorName: meeting.sector.name,
                occurrenceDate: toIsoDate(occurrence),
                startTime: meeting.startTime.toISOString().slice(11, 16),
                location: meeting.location,
                expectedAttendees: meeting.expectedAttendees,
                color: meeting.color,
            }
        })
        .filter((meeting): meeting is DashboardUpcomingMeetingDto => meeting !== null)
        .sort((left, right) =>
            `${left.occurrenceDate}T${left.startTime}`.localeCompare(
                `${right.occurrenceDate}T${right.startTime}`,
            ),
        )
        .slice(0, 5)
}

export async function getDashboardSummary(
    query: DashboardQueryDto,
    sectorIds?: number[],
    now = new Date(),
): Promise<DashboardSummaryDto> {
    const today = startOfUtcDay(now)
    const endExclusive = addUtcDays(today, 1)
    const currentStart = addUtcDays(endExclusive, -query.periodDays)
    const previousStart = addUtcDays(currentStart, -query.periodDays)
    const data = await findDashboardData({
        rangeStart: previousStart,
        currentStart,
        endExclusive,
        sectorIds,
        districtId: query.districtId,
    })

    const currentOfferings = data.offerings.filter((offering) => offering.date >= currentStart)
    const previousOfferings = data.offerings.filter((offering) => offering.date < currentStart)
    const sumAttendance = (offerings: typeof data.offerings) =>
        offerings.reduce((sum, offering) => sum + offering.attendance, 0)
    const sumOfferings = (offerings: typeof data.offerings) =>
        offerings.reduce((sum, offering) => sum + Number(offering.totalAmount), 0)
    const currentAttendance = sumAttendance(currentOfferings)
    const previousAttendance = sumAttendance(previousOfferings)
    const currentAmount = sumOfferings(currentOfferings)
    const previousAmount = sumOfferings(previousOfferings)
    const expectedAttendance = currentOfferings.reduce(
        (sum, offering) => sum + offering.meeting.expectedAttendees,
        0,
    )

    const districtTotals = new Map<
        number,
        { name: string; attendance: number; offerings: number; meetingCount: number }
    >()
    for (const offering of currentOfferings) {
        const district = offering.meeting.sector.zone.district
        const current = districtTotals.get(district.id) ?? {
            name: district.name,
            attendance: 0,
            offerings: 0,
            meetingCount: 0,
        }
        current.attendance += offering.attendance
        current.offerings += Number(offering.totalAmount)
        current.meetingCount += 1
        districtTotals.set(district.id, current)
    }

    return {
        generatedAt: now.toISOString(),
        period: {
            days: query.periodDays,
            startDate: toIsoDate(currentStart),
            endDate: toIsoDate(today),
            previousStartDate: toIsoDate(previousStart),
            previousEndDate: toIsoDate(addUtcDays(currentStart, -1)),
        },
        filters: {
            selectedDistrictId: query.districtId ?? null,
            districts: data.districts,
        },
        metrics: {
            activeMembers: data.activeMembers,
            newMembers: metric(data.newMembers, data.previousNewMembers),
            attendance: metric(currentAttendance, previousAttendance),
            offerings: metric(currentAmount, previousAmount),
            registeredMeetings: metric(currentOfferings.length, previousOfferings.length),
            averageAttendance:
                currentOfferings.length > 0
                    ? round2(currentAttendance / currentOfferings.length)
                    : 0,
            averageOffering:
                currentOfferings.length > 0 ? round2(currentAmount / currentOfferings.length) : 0,
            attendanceGoalRate:
                expectedAttendance > 0 ? round2((currentAttendance / expectedAttendance) * 100) : 0,
            offeringPerAttendee:
                currentAttendance > 0 ? round2(currentAmount / currentAttendance) : 0,
            // Disciplina de captura: qué porcentaje de las fechas esperadas fue registrado.
            recordingCoverage:
                data.expectedOccurrences > 0
                    ? round2((data.offerings.length / data.expectedOccurrences) * 100)
                    : 0,
            pendingOccurrences: Math.max(0, data.expectedOccurrences - data.offerings.length),
        },
        trends: createTrend(currentOfferings, currentStart, query.periodDays),
        categoryDistribution: buildCategoryDistribution(currentOfferings),
        districtPerformance: [...districtTotals]
            .map(([id, district]) => ({
                id,
                name: district.name,
                attendance: district.attendance,
                offerings: round2(district.offerings),
                meetingCount: district.meetingCount,
                averageAttendance:
                    district.meetingCount > 0
                        ? round2(district.attendance / district.meetingCount)
                        : 0,
            }))
            .sort((left, right) => right.offerings - left.offerings),
        recentOfferings: currentOfferings.slice(0, 6).map((offering) => ({
            id: offering.id,
            meetingId: offering.meetingId,
            meetingTitle: offering.meeting.title,
            districtName: offering.meeting.sector.zone.district.name,
            date: toIsoDate(offering.date),
            attendance: offering.attendance,
            totalAmount: Number(offering.totalAmount),
            currency: offering.currency,
        })),
        upcomingMeetings: buildUpcomingMeetings(data.meetings, today),
    }
}
