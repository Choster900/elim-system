import {
    GENERAL_MEETING_SCOPE_LABEL,
    UNASSIGNED_MEETING_SCOPE_LABEL,
} from '~/presentation/meetings/utils/meeting-format.util'
import { formatLocalIsoDate } from '~/utils/date/date-format.util'
import type {
    MeetingReportRow,
    ReportOccurrenceStatus,
    ReportReception,
} from '../interfaces/meeting-report.interface'

const REPORT_LOCALE = 'es-SV'

const moneyFormatter = new Intl.NumberFormat(REPORT_LOCALE, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const plainMoneyFormatter = new Intl.NumberFormat(REPORT_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat(REPORT_LOCALE, { maximumFractionDigits: 1 })

export function formatReportMoney(value: number | null | undefined) {
    return moneyFormatter.format(value ?? 0)
}

export function formatReportAmount(value: number | null | undefined) {
    return plainMoneyFormatter.format(value ?? 0)
}

export function formatReportSignedMoney(value: number | null | undefined) {
    const amount = value ?? 0
    if (amount === 0) return formatReportMoney(0)
    return `${amount > 0 ? '+' : '-'}${formatReportMoney(Math.abs(amount))}`
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

export function reportStatusLabel(status: ReportOccurrenceStatus) {
    return status === 'registrada' ? 'Registrada' : 'Pendiente'
}

export function reportReceptionLabel(
    reception: ReportReception | null,
    status: ReportOccurrenceStatus,
) {
    if (!reception) return status === 'registrada' ? 'Sin entregar' : '—'
    if (reception.status === 'cuadra') return 'Cuadra'
    return reception.isClosed ? 'Diferencia cerrada' : 'Con diferencia'
}
