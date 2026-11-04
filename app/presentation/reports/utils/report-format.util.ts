import {
    GENERAL_MEETING_SCOPE_LABEL,
    UNASSIGNED_MEETING_SCOPE_LABEL,
} from '~/presentation/meetings/utils/meeting-format.util'
import { formatLocalIsoDate } from '~/utils/date/date-format.util'
import type {
    MeetingReportAggregate,
    MeetingReportRow,
    ReportReceptionState,
} from '../interfaces/meeting-report.interface'

const REPORT_LOCALE = 'es-SV'

export const TITHE_LABEL = 'Diezmo'
export const TITHES_LABEL = 'Diezmos individuales'
export const TITHE_COLOR = '#C9A227'
export const TITHES_TERRITORY_LABEL = 'Según cada diezmador'

const moneyFormatter = new Intl.NumberFormat(REPORT_LOCALE, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat(REPORT_LOCALE, { maximumFractionDigits: 1 })

export function formatReportMoney(value: number | null | undefined) {
    return moneyFormatter.format(value ?? 0)
}

export function formatReportNumber(value: number | null | undefined) {
    return numberFormatter.format(value ?? 0)
}

export function formatReportPercent(value: number | null | undefined, digits = 1) {
    if (value === null || value === undefined) return '—'
    return `${(value * 100).toLocaleString(REPORT_LOCALE, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })} %`
}

export function formatReportDate(isoDate: string | null | undefined) {
    if (!isoDate) return '—'
    return formatLocalIsoDate(isoDate, { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatReportWeekday(isoDate: string) {
    return formatLocalIsoDate(isoDate, { weekday: 'long' })
}

export function formatReportDateTime(value: string | null | undefined) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString(REPORT_LOCALE, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatReportRange(from: string, to: string) {
    return from === to
        ? formatReportDate(from)
        : `${formatReportDate(from)} – ${formatReportDate(to)}`
}

export function reportTerritoryLabel(
    row: Pick<MeetingReportRow, 'isGeneral' | 'sectorName' | 'zoneName' | 'districtName'>,
) {
    if (!row.sectorName) {
        return row.isGeneral ? GENERAL_MEETING_SCOPE_LABEL : UNASSIGNED_MEETING_SCOPE_LABEL
    }
    return [row.sectorName, row.zoneName, row.districtName].filter(Boolean).join(' · ')
}

export function reportDistrictLabel(row: Pick<MeetingReportRow, 'isGeneral' | 'districtName'>) {
    if (row.districtName) return row.districtName
    return row.isGeneral ? GENERAL_MEETING_SCOPE_LABEL : UNASSIGNED_MEETING_SCOPE_LABEL
}

type AggregateTerritory = Pick<
    MeetingReportAggregate,
    'source' | 'isGeneral' | 'sectorName' | 'zoneName' | 'districtName'
>

export function reportAggregateTerritoryLabel(item: AggregateTerritory) {
    return item.source === 'diezmo' ? TITHES_TERRITORY_LABEL : reportTerritoryLabel(item)
}

export function reportAggregateDistrictLabel(item: AggregateTerritory) {
    return item.source === 'diezmo' ? TITHES_TERRITORY_LABEL : reportDistrictLabel(item)
}

export function reportRowTitle(
    row: Pick<MeetingReportRow, 'source' | 'meetingTitle' | 'titherName'>,
) {
    return row.source === 'diezmo' ? (row.titherName ?? TITHE_LABEL) : (row.meetingTitle ?? '')
}

export function reportRowCode(
    row: Pick<MeetingReportRow, 'source' | 'meetingCode' | 'titherCode'>,
) {
    return (row.source === 'diezmo' ? row.titherCode : row.meetingCode) ?? ''
}

export function reportRowType(row: Pick<MeetingReportRow, 'source' | 'meetingTypeName'>) {
    return row.source === 'diezmo' ? TITHE_LABEL : (row.meetingTypeName ?? '')
}

export function reportRowColor(row: Pick<MeetingReportRow, 'source' | 'meetingColor'>) {
    return row.source === 'diezmo' ? TITHE_COLOR : (row.meetingColor ?? TITHE_COLOR)
}

export const receptionStateLabels: Record<ReportReceptionState, string> = {
    cuadra: 'Cuadra',
    diferencia_abierta: 'Con diferencia',
    diferencia_cerrada: 'Diferencia cerrada',
}

export function reportStateLabel(state: ReportReceptionState | null) {
    return state ? receptionStateLabels[state] : TITHE_LABEL
}
