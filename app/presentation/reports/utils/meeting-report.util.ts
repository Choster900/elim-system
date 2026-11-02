import type {
    CategoryReportTotal,
    DistrictReportAggregate,
    MeetingReportAggregate,
    MeetingReportFilters,
    MeetingReportRow,
    ReportCategory,
    ReportDateRange,
    ReportSummary,
    ReportTrend,
    ReportTrendGranularity,
    ReportTrendPoint,
} from '../interfaces/meeting-report.interface'
import { formatReportDate, reportDistrictLabel } from './report-format.util'

const DAY_MS = 86_400_000
const DAILY_TREND_MAX_DAYS = 31
const WEEKLY_TREND_MAX_DAYS = 120

export const UNCATEGORIZED_LABEL = 'Sin categoría'

export function toCents(value: number | null | undefined) {
    return Math.round((value ?? 0) * 100)
}

export function fromCents(cents: number) {
    return cents / 100
}

function ratio(part: number, total: number) {
    return total > 0 ? part / total : 0
}

function isoToUtc(iso: string) {
    return Date.parse(`${iso}T00:00:00Z`)
}

function utcToIso(time: number) {
    return new Date(time).toISOString().slice(0, 10)
}

export function addIsoDays(iso: string, days: number) {
    return utcToIso(isoToUtc(iso) + days * DAY_MS)
}

export function rangeDays(range: ReportDateRange) {
    return Math.round((isoToUtc(range.to) - isoToUtc(range.from)) / DAY_MS) + 1
}

export function isRecorded(row: MeetingReportRow) {
    return row.status === 'registrada'
}

export function createEmptyFilters(): MeetingReportFilters {
    return {
        kind: 'todas',
        status: 'todas',
        meetingTypeIds: [],
        districtId: null,
        zoneId: null,
        sectorId: null,
    }
}

export function filterReportRows(rows: MeetingReportRow[], filters: MeetingReportFilters) {
    return rows.filter((row) => {
        if (filters.kind === 'celulas' && row.isGeneral) return false
        if (filters.kind === 'generales' && !row.isGeneral) return false
        if (filters.status !== 'todas' && row.status !== filters.status) return false
        if (
            filters.meetingTypeIds.length > 0 &&
            !filters.meetingTypeIds.includes(row.meetingTypeId)
        ) {
            return false
        }
        if (filters.districtId !== null && row.districtId !== filters.districtId) return false
        if (filters.zoneId !== null && row.zoneId !== filters.zoneId) return false
        if (filters.sectorId !== null && row.sectorId !== filters.sectorId) return false
        return true
    })
}

export function sumOfferings(rows: MeetingReportRow[]) {
    return fromCents(rows.reduce((sum, row) => sum + toCents(row.totalAmount), 0))
}

export function sumAttendance(rows: MeetingReportRow[]) {
    return rows.reduce((sum, row) => sum + (row.attendance ?? 0), 0)
}

export function sumCategory(rows: MeetingReportRow[], categoryId: number) {
    return fromCents(
        rows.reduce(
            (sum, row) =>
                sum +
                row.offerings
                    .filter((offering) => offering.categoryId === categoryId)
                    .reduce((acc, offering) => acc + toCents(offering.amount), 0),
            0,
        ),
    )
}

export function sumUncategorized(rows: MeetingReportRow[]) {
    return fromCents(rows.reduce((sum, row) => sum + toCents(row.uncategorizedAmount), 0))
}

export function sumReceived(rows: MeetingReportRow[]) {
    return fromCents(rows.reduce((sum, row) => sum + toCents(row.reception?.receivedAmount), 0))
}

export function sumReceivedDifference(rows: MeetingReportRow[]) {
    return fromCents(rows.reduce((sum, row) => sum + toCents(row.reception?.difference), 0))
}

export function summarizeReport(rows: MeetingReportRow[]): ReportSummary {
    const recorded = rows.filter(isRecorded)
    const withAttendance = recorded.filter((row) => row.attendance !== null)
    const totalCents = recorded.reduce((sum, row) => sum + toCents(row.totalAmount), 0)
    const attendanceOfferingCents = withAttendance
        .filter((row) => (row.attendance ?? 0) > 0)
        .reduce((sum, row) => sum + toCents(row.totalAmount), 0)
    const totalAttendance = sumAttendance(withAttendance)
    const recordedMeetings = new Set(recorded.map((row) => row.meetingId)).size
    const received = rows.filter((row) => row.reception !== null)

    return {
        meetingCount: new Set(rows.map((row) => row.meetingId)).size,
        occurrenceCount: rows.length,
        recordedCount: recorded.length,
        pendingCount: rows.length - recorded.length,
        complianceRate: rows.length > 0 ? recorded.length / rows.length : null,
        totalOfferings: fromCents(totalCents),
        averagePerOccurrence: fromCents(Math.round(ratio(totalCents, recorded.length))),
        averagePerMeeting: fromCents(Math.round(ratio(totalCents, recordedMeetings))),
        totalAttendance,
        averageAttendance: ratio(totalAttendance, withAttendance.length),
        offeringPerAttendee: fromCents(Math.round(ratio(attendanceOfferingCents, totalAttendance))),
        receivedCount: received.length,
        receivedAmount: sumReceived(received),
        receivedDifference: sumReceivedDifference(received),
        discrepancyCount: received.filter(
            (row) => row.reception?.status === 'con_diferencia' && !row.reception.isClosed,
        ).length,
        unreceivedCount: recorded.filter((row) => row.reception === null).length,
    }
}

export function groupByMeeting(rows: MeetingReportRow[]): MeetingReportAggregate[] {
    const grandTotalCents = rows.reduce((sum, row) => sum + toCents(row.totalAmount), 0)
    const groups = new Map<number, MeetingReportRow[]>()
    for (const row of rows) {
        const group = groups.get(row.meetingId)
        if (group) group.push(row)
        else groups.set(row.meetingId, [row])
    }

    return [...groups.values()]
        .map((group) => {
            const latest = group.reduce((acc, row) => (row.date > acc.date ? row : acc))
            const recorded = group.filter(isRecorded)
            const withAttendance = recorded.filter((row) => row.attendance !== null)
            const totalCents = recorded.reduce((sum, row) => sum + toCents(row.totalAmount), 0)
            const categoryCents = new Map<number, number>()
            for (const row of recorded) {
                for (const offering of row.offerings) {
                    categoryCents.set(
                        offering.categoryId,
                        (categoryCents.get(offering.categoryId) ?? 0) + toCents(offering.amount),
                    )
                }
            }
            const attendance = sumAttendance(withAttendance)
            const dates = group.map((row) => row.date).sort()
            const recordedDates = recorded.map((row) => row.date).sort()

            return {
                meetingId: latest.meetingId,
                meetingCode: latest.meetingCode,
                meetingTitle: latest.meetingTitle,
                meetingColor: latest.meetingColor,
                meetingTypeName: latest.meetingTypeName,
                isGeneral: latest.isGeneral,
                isMeetingActive: latest.isMeetingActive,
                districtName: latest.districtName,
                zoneName: latest.zoneName,
                sectorName: latest.sectorName,
                leaderName: latest.leaderName,
                occurrenceCount: group.length,
                recordedCount: recorded.length,
                pendingCount: group.length - recorded.length,
                attendance,
                averageAttendance: ratio(attendance, withAttendance.length),
                categoryAmounts: Object.fromEntries(
                    [...categoryCents].map(([id, cents]) => [id, fromCents(cents)]),
                ),
                uncategorizedAmount: sumUncategorized(recorded),
                totalOfferings: fromCents(totalCents),
                averageOffering: fromCents(Math.round(ratio(totalCents, recorded.length))),
                share: ratio(totalCents, grandTotalCents),
                receivedAmount: sumReceived(group),
                receivedDifference: sumReceivedDifference(group),
                firstDate: dates[0]!,
                lastDate: dates.at(-1)!,
                lastRecordedDate: recordedDates.at(-1) ?? null,
            }
        })
        .sort(
            (left, right) =>
                right.totalOfferings - left.totalOfferings ||
                left.meetingCode.localeCompare(right.meetingCode, 'es'),
        )
}

export function groupByDistrict(rows: MeetingReportRow[]): DistrictReportAggregate[] {
    const grandTotalCents = rows.reduce((sum, row) => sum + toCents(row.totalAmount), 0)
    const groups = new Map<string, MeetingReportRow[]>()
    for (const row of rows) {
        const key =
            row.districtId !== null
                ? `d-${row.districtId}`
                : row.isGeneral
                  ? 'general'
                  : 'sin-asignar'
        const group = groups.get(key)
        if (group) group.push(row)
        else groups.set(key, [row])
    }

    return [...groups.entries()]
        .map(([key, group]) => {
            const recorded = group.filter(isRecorded)
            const withAttendance = recorded.filter((row) => row.attendance !== null)
            const totalCents = recorded.reduce((sum, row) => sum + toCents(row.totalAmount), 0)
            const attendance = sumAttendance(withAttendance)

            return {
                key,
                districtName: reportDistrictLabel(group[0]!),
                meetingCount: new Set(group.map((row) => row.meetingId)).size,
                occurrenceCount: group.length,
                recordedCount: recorded.length,
                pendingCount: group.length - recorded.length,
                attendance,
                averageAttendance: ratio(attendance, withAttendance.length),
                totalOfferings: fromCents(totalCents),
                averageOffering: fromCents(Math.round(ratio(totalCents, recorded.length))),
                share: ratio(totalCents, grandTotalCents),
                receivedAmount: sumReceived(group),
                receivedDifference: sumReceivedDifference(group),
            }
        })
        .sort((left, right) => right.totalOfferings - left.totalOfferings)
}

export function categoryTotals(
    rows: MeetingReportRow[],
    categories: ReportCategory[],
): CategoryReportTotal[] {
    const grandTotalCents = rows.reduce((sum, row) => sum + toCents(row.totalAmount), 0)
    const totals: CategoryReportTotal[] = categories.map((category) => {
        const amount = sumCategory(rows, category.id)
        return {
            id: category.id,
            name: category.name,
            amount,
            share: ratio(toCents(amount), grandTotalCents),
        }
    })
    const uncategorized = sumUncategorized(rows)
    if (uncategorized > 0) {
        totals.push({
            id: 'uncategorized',
            name: UNCATEGORIZED_LABEL,
            amount: uncategorized,
            share: ratio(toCents(uncategorized), grandTotalCents),
        })
    }
    return totals
}

export function usedCategories(rows: MeetingReportRow[], categories: ReportCategory[]) {
    const used = new Set(
        rows.flatMap((row) => row.offerings.map((offering) => offering.categoryId)),
    )
    return categories.filter((category) => used.has(category.id))
}

export function trendGranularity(range: ReportDateRange): ReportTrendGranularity {
    const days = rangeDays(range)
    if (days <= DAILY_TREND_MAX_DAYS) return 'day'
    if (days <= WEEKLY_TREND_MAX_DAYS) return 'week'
    return 'month'
}

function bucketStart(iso: string, granularity: ReportTrendGranularity) {
    if (granularity === 'day') return iso
    if (granularity === 'month') return `${iso.slice(0, 7)}-01`
    const weekday = new Date(isoToUtc(iso)).getUTCDay()
    return addIsoDays(iso, -((weekday + 6) % 7))
}

function nextBucket(iso: string, granularity: ReportTrendGranularity) {
    if (granularity === 'day') return addIsoDays(iso, 1)
    if (granularity === 'week') return addIsoDays(iso, 7)
    const date = new Date(isoToUtc(iso))
    return utcToIso(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
}

function bucketLabel(iso: string, granularity: ReportTrendGranularity) {
    const date = new Date(isoToUtc(iso))
    if (granularity === 'month') {
        return date
            .toLocaleDateString('es-SV', { month: 'short', year: '2-digit', timeZone: 'UTC' })
            .replace('.', '')
    }
    const label = date
        .toLocaleDateString('es-SV', { day: '2-digit', month: 'short', timeZone: 'UTC' })
        .replace('.', '')
    return granularity === 'week' ? `Sem. ${label}` : label
}

export function buildReportTrend(rows: MeetingReportRow[], range: ReportDateRange): ReportTrend {
    const granularity = trendGranularity(range)
    const buckets = new Map<string, { cents: number; attendance: number; recorded: number }>()
    for (
        let cursor = bucketStart(range.from, granularity);
        cursor <= range.to;
        cursor = nextBucket(cursor, granularity)
    ) {
        buckets.set(cursor, { cents: 0, attendance: 0, recorded: 0 })
    }

    for (const row of rows.filter(isRecorded)) {
        const bucket = buckets.get(bucketStart(row.date, granularity))
        if (!bucket) continue
        bucket.cents += toCents(row.totalAmount)
        bucket.attendance += row.attendance ?? 0
        bucket.recorded += 1
    }

    const points = [...buckets.entries()]
    const detailOf = (start: string, recorded: number) => {
        const end = granularity === 'day' ? start : addIsoDays(nextBucket(start, granularity), -1)
        const period =
            granularity === 'day'
                ? formatReportDate(start)
                : `${formatReportDate(start < range.from ? range.from : start)} – ${formatReportDate(end > range.to ? range.to : end)}`
        return [period, `${recorded} ${recorded === 1 ? 'fecha registrada' : 'fechas registradas'}`]
    }

    return {
        granularity,
        offerings: points.map<ReportTrendPoint>(([start, bucket]) => ({
            key: start,
            label: bucketLabel(start, granularity),
            value: fromCents(bucket.cents),
            detail: detailOf(start, bucket.recorded),
        })),
        attendance: points.map<ReportTrendPoint>(([start, bucket]) => ({
            key: start,
            label: bucketLabel(start, granularity),
            value: bucket.attendance,
            detail: detailOf(start, bucket.recorded),
        })),
    }
}
