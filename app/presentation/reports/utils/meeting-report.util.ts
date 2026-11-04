import type {
    CategoryReportTotal,
    DistrictReportAggregate,
    MeetingReportAggregate,
    MeetingReportFilters,
    MeetingReportRow,
    ReportCategory,
    ReportDateRange,
    ReportMeetingKind,
    ReportReceptionState,
    ReportSummary,
    ReportTrend,
    ReportTrendGranularity,
    TitherReportAggregate,
} from '../interfaces/meeting-report.interface'
import {
    TITHE_COLOR,
    TITHE_LABEL,
    TITHES_LABEL,
    formatReportDate,
    reportDistrictLabel,
} from './report-format.util'

const DAY_MS = 86_400_000
const DAILY_TREND_MAX_DAYS = 14
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

function addIsoDays(iso: string, days: number) {
    return utcToIso(isoToUtc(iso) + days * DAY_MS)
}

export function rangeDays(range: ReportDateRange) {
    return Math.round((isoToUtc(range.to) - isoToUtc(range.from)) / DAY_MS) + 1
}

export function isTitheRow(row: Pick<MeetingReportRow, 'source'>) {
    return row.source === 'diezmo'
}

export function receptionState(
    row: Pick<MeetingReportRow, 'status' | 'isClosed'>,
): ReportReceptionState | null {
    if (row.status === null) return null
    if (row.status === 'cuadra') return 'cuadra'
    return row.isClosed ? 'diferencia_cerrada' : 'diferencia_abierta'
}

export const REPORT_MEETING_KINDS: readonly ReportMeetingKind[] = [
    'celulas',
    'generales',
    'diezmos',
]

export function reportRowKind(
    row: Pick<MeetingReportRow, 'source' | 'isGeneral'>,
): ReportMeetingKind {
    if (isTitheRow(row)) return 'diezmos'
    return row.isGeneral ? 'generales' : 'celulas'
}

export function createEmptyFilters(): MeetingReportFilters {
    return {
        kinds: [...REPORT_MEETING_KINDS],
        state: 'todas',
        meetingTypeIds: [],
        districtId: null,
        zoneId: null,
        sectorId: null,
    }
}

export function filterReportRows(rows: MeetingReportRow[], filters: MeetingReportFilters) {
    return rows.filter((row) => {
        if (!filters.kinds.includes(reportRowKind(row))) return false
        if (filters.state !== 'todas' && receptionState(row) !== filters.state) return false
        if (
            filters.meetingTypeIds.length > 0 &&
            (row.meetingTypeId === null || !filters.meetingTypeIds.includes(row.meetingTypeId))
        ) {
            return false
        }
        if (filters.districtId !== null && row.districtId !== filters.districtId) return false
        if (filters.zoneId !== null && row.zoneId !== filters.zoneId) return false
        if (filters.sectorId !== null && row.sectorId !== filters.sectorId) return false
        return true
    })
}

export function sumReceived(rows: MeetingReportRow[]) {
    return fromCents(rows.reduce((sum, row) => sum + toCents(row.receivedAmount), 0))
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

export function sumTithes(rows: MeetingReportRow[]) {
    return sumReceived(rows.filter(isTitheRow))
}

export function summarizeReport(rows: MeetingReportRow[]): ReportSummary {
    const meetingRows = rows.filter((row) => !isTitheRow(row))
    const titheRows = rows.filter(isTitheRow)
    const totalCents = toCents(sumReceived(rows))
    const meetingCents = toCents(sumReceived(meetingRows))
    const titheCents = toCents(sumReceived(titheRows))
    const meetingCount = new Set(meetingRows.map((row) => row.meetingId)).size
    const titherCount = new Set(titheRows.map((row) => row.titherId)).size
    const countState = (state: ReportReceptionState) =>
        meetingRows.filter((row) => receptionState(row) === state).length
    const balancedCount = countState('cuadra')

    return {
        meetingCount,
        envelopeCount: rows.length,
        meetingEnvelopeCount: meetingRows.length,
        totalReceived: fromCents(totalCents),
        meetingTotal: fromCents(meetingCents),
        averagePerEnvelope: fromCents(Math.round(ratio(totalCents, rows.length))),
        averagePerMeeting: fromCents(Math.round(ratio(meetingCents, meetingCount))),
        balancedCount,
        openDiscrepancyCount: countState('diferencia_abierta'),
        closedDiscrepancyCount: countState('diferencia_cerrada'),
        directEntryCount: meetingRows.filter((row) => row.directEntry).length,
        balancedRate: meetingRows.length > 0 ? balancedCount / meetingRows.length : null,
        titheCount: titheRows.length,
        titherCount,
        titheTotal: fromCents(titheCents),
        averagePerTither: fromCents(Math.round(ratio(titheCents, titherCount))),
        averagePerTithe: fromCents(Math.round(ratio(titheCents, titheRows.length))),
        largestTithe: fromCents(
            titheRows.reduce((max, row) => Math.max(max, toCents(row.receivedAmount)), 0),
        ),
    }
}

function groupRows<K>(rows: MeetingReportRow[], keyOf: (row: MeetingReportRow) => K) {
    const groups = new Map<K, MeetingReportRow[]>()
    for (const row of rows) {
        const key = keyOf(row)
        const group = groups.get(key)
        if (group) group.push(row)
        else groups.set(key, [row])
    }
    return groups
}

const TITHES_GROUP_KEY = 'diezmos'

function sortedDates(group: MeetingReportRow[]) {
    const dates = group.map((row) => row.date).sort()
    return { firstDate: dates[0]!, lastDate: dates.at(-1)! }
}

function titheAggregate(
    group: MeetingReportRow[],
    grandTotalCents: number,
): MeetingReportAggregate {
    const totalCents = toCents(sumReceived(group))
    return {
        key: TITHES_GROUP_KEY,
        source: 'diezmo',
        meetingId: null,
        meetingCode: '',
        meetingTitle: TITHES_LABEL,
        meetingColor: TITHE_COLOR,
        meetingTypeName: TITHE_LABEL,
        isGeneral: false,
        isMeetingActive: true,
        districtName: null,
        zoneName: null,
        sectorName: null,
        leaderName: null,
        envelopeCount: group.length,
        openDiscrepancyCount: 0,
        categoryAmounts: {},
        uncategorizedAmount: 0,
        titheAmount: fromCents(totalCents),
        totalReceived: fromCents(totalCents),
        averagePerEnvelope: fromCents(Math.round(ratio(totalCents, group.length))),
        share: ratio(totalCents, grandTotalCents),
        ...sortedDates(group),
    }
}

function meetingAggregate(
    group: MeetingReportRow[],
    grandTotalCents: number,
): MeetingReportAggregate {
    const latest = group.reduce((acc, row) => (row.date > acc.date ? row : acc))
    const totalCents = toCents(sumReceived(group))
    const categoryCents = new Map<number, number>()
    for (const row of group) {
        for (const offering of row.offerings) {
            categoryCents.set(
                offering.categoryId,
                (categoryCents.get(offering.categoryId) ?? 0) + toCents(offering.amount),
            )
        }
    }

    return {
        key: `m-${latest.meetingId}`,
        source: 'reunion',
        meetingId: latest.meetingId,
        meetingCode: latest.meetingCode ?? '',
        meetingTitle: latest.meetingTitle ?? '',
        meetingColor: latest.meetingColor ?? TITHE_COLOR,
        meetingTypeName: latest.meetingTypeName ?? '',
        isGeneral: latest.isGeneral,
        isMeetingActive: latest.isMeetingActive,
        districtName: latest.districtName,
        zoneName: latest.zoneName,
        sectorName: latest.sectorName,
        leaderName: latest.leaderName,
        envelopeCount: group.length,
        openDiscrepancyCount: group.filter((row) => receptionState(row) === 'diferencia_abierta')
            .length,
        categoryAmounts: Object.fromEntries(
            [...categoryCents].map(([id, cents]) => [id, fromCents(cents)]),
        ),
        uncategorizedAmount: sumUncategorized(group),
        titheAmount: 0,
        totalReceived: fromCents(totalCents),
        averagePerEnvelope: fromCents(Math.round(ratio(totalCents, group.length))),
        share: ratio(totalCents, grandTotalCents),
        ...sortedDates(group),
    }
}

export function groupByMeeting(rows: MeetingReportRow[]): MeetingReportAggregate[] {
    const grandTotalCents = toCents(sumReceived(rows))

    return [
        ...groupRows(rows, (row) =>
            isTitheRow(row) ? TITHES_GROUP_KEY : `m-${row.meetingId}`,
        ).entries(),
    ]
        .map(([key, group]) =>
            key === TITHES_GROUP_KEY
                ? titheAggregate(group, grandTotalCents)
                : meetingAggregate(group, grandTotalCents),
        )
        .sort(
            (left, right) =>
                right.totalReceived - left.totalReceived ||
                left.meetingCode.localeCompare(right.meetingCode, 'es'),
        )
}

export function groupByTither(rows: MeetingReportRow[]): TitherReportAggregate[] {
    const titheRows = rows.filter(isTitheRow)
    const grandTotalCents = toCents(sumReceived(rows))
    const titheTotalCents = toCents(sumReceived(titheRows))

    return [...groupRows(titheRows, (row) => row.titherId).values()]
        .map((group) => {
            const latest = group.reduce((acc, row) => (row.date > acc.date ? row : acc))
            const totalCents = toCents(sumReceived(group))
            return {
                key: `t-${latest.titherId}`,
                titherId: latest.titherId ?? 0,
                titherCode: latest.titherCode ?? '',
                titherName: latest.titherName ?? TITHE_LABEL,
                isGeneral: false,
                districtName: latest.districtName,
                zoneName: latest.zoneName,
                sectorName: latest.sectorName,
                envelopeCount: group.length,
                totalReceived: fromCents(totalCents),
                averagePerEnvelope: fromCents(Math.round(ratio(totalCents, group.length))),
                titheShare: ratio(totalCents, titheTotalCents),
                share: ratio(totalCents, grandTotalCents),
                ...sortedDates(group),
            }
        })
        .sort(
            (left, right) =>
                right.totalReceived - left.totalReceived ||
                left.titherName.localeCompare(right.titherName, 'es'),
        )
}

export function groupByDistrict(rows: MeetingReportRow[]): DistrictReportAggregate[] {
    const grandTotalCents = toCents(sumReceived(rows))
    const groups = groupRows(rows, (row) =>
        row.districtId !== null ? `d-${row.districtId}` : row.isGeneral ? 'general' : 'sin-asignar',
    )

    return [...groups.entries()]
        .map(([key, group]) => {
            const totalCents = toCents(sumReceived(group))
            const meetingRows = group.filter((row) => !isTitheRow(row))
            const titheRows = group.filter(isTitheRow)
            return {
                key,
                districtName: reportDistrictLabel(group[0]!),
                meetingCount: new Set(meetingRows.map((row) => row.meetingId)).size,
                titherCount: new Set(titheRows.map((row) => row.titherId)).size,
                envelopeCount: group.length,
                totalReceived: fromCents(totalCents),
                averagePerEnvelope: fromCents(Math.round(ratio(totalCents, group.length))),
                share: ratio(totalCents, grandTotalCents),
            }
        })
        .sort((left, right) => right.totalReceived - left.totalReceived)
}

export function categoryTotals(
    rows: MeetingReportRow[],
    categories: ReportCategory[],
): CategoryReportTotal[] {
    const grandTotalCents = toCents(sumReceived(rows))
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
    const tithes = sumTithes(rows)
    if (tithes > 0) {
        totals.push({
            id: 'tithes',
            name: TITHES_LABEL,
            amount: tithes,
            share: ratio(toCents(tithes), grandTotalCents),
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

function trendGranularity(range: ReportDateRange): ReportTrendGranularity {
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
    const buckets = new Map<string, { cents: number; envelopes: number }>()
    for (
        let cursor = bucketStart(range.from, granularity);
        cursor <= range.to;
        cursor = nextBucket(cursor, granularity)
    ) {
        buckets.set(cursor, { cents: 0, envelopes: 0 })
    }

    for (const row of rows) {
        const bucket = buckets.get(bucketStart(row.date, granularity))
        if (!bucket) continue
        bucket.cents += toCents(row.receivedAmount)
        bucket.envelopes += 1
    }

    return {
        granularity,
        received: [...buckets.entries()].map(([start, bucket]) => {
            const end =
                granularity === 'day' ? start : addIsoDays(nextBucket(start, granularity), -1)
            const period =
                granularity === 'day'
                    ? formatReportDate(start)
                    : `${formatReportDate(start < range.from ? range.from : start)} – ${formatReportDate(end > range.to ? range.to : end)}`
            return {
                key: start,
                label: bucketLabel(start, granularity),
                value: fromCents(bucket.cents),
                detail: [
                    period,
                    `${bucket.envelopes} ${bucket.envelopes === 1 ? 'sobre recibido' : 'sobres recibidos'}`,
                ],
            }
        }),
    }
}
