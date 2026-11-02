import type { ReportDateRange } from '../interfaces/meeting-report.interface'

export type ReportRangePresetKey =
    'esta-semana' | 'este-mes' | 'mes-anterior' | 'ultimos-30' | 'este-trimestre' | 'este-anio'

export const reportRangePresets: { key: ReportRangePresetKey; label: string }[] = [
    { key: 'esta-semana', label: 'Esta semana' },
    { key: 'este-mes', label: 'Este mes' },
    { key: 'mes-anterior', label: 'Mes anterior' },
    { key: 'ultimos-30', label: 'Últimos 30 días' },
    { key: 'este-trimestre', label: 'Este trimestre' },
    { key: 'este-anio', label: 'Este año' },
]

const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function localIso(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

function localDate(year: number, month: number, day: number) {
    return localIso(new Date(year, month, day))
}

export function isIsoDay(value: unknown): value is string {
    if (typeof value !== 'string' || !ISO_DAY_PATTERN.test(value)) return false
    const parsed = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function resolveReportRangePreset(
    key: ReportRangePresetKey,
    today = new Date(),
): ReportDateRange {
    const year = today.getFullYear()
    const month = today.getMonth()
    const day = today.getDate()

    switch (key) {
        case 'esta-semana': {
            const offset = (today.getDay() + 6) % 7
            return {
                from: localDate(year, month, day - offset),
                to: localDate(year, month, day - offset + 6),
            }
        }
        case 'mes-anterior':
            return { from: localDate(year, month - 1, 1), to: localDate(year, month, 0) }
        case 'ultimos-30':
            return { from: localDate(year, month, day - 29), to: localIso(today) }
        case 'este-trimestre': {
            const quarterStart = month - (month % 3)
            return {
                from: localDate(year, quarterStart, 1),
                to: localDate(year, quarterStart + 3, 0),
            }
        }
        case 'este-anio':
            return { from: localDate(year, 0, 1), to: localDate(year, 11, 31) }
        case 'este-mes':
        default:
            return { from: localDate(year, month, 1), to: localDate(year, month + 1, 0) }
    }
}

export function defaultReportRange() {
    return resolveReportRangePreset('este-mes')
}

export function matchReportRangePreset(range: ReportDateRange, today = new Date()) {
    return (
        reportRangePresets.find((preset) => {
            const candidate = resolveReportRangePreset(preset.key, today)
            return candidate.from === range.from && candidate.to === range.to
        })?.key ?? null
    )
}
