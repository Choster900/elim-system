import { formatLocalIsoDate } from '~/utils/date/date-format.util'

export type PeriodPresetKey =
    | 'este-mes'
    | 'mes-pasado'
    | 'este-trimestre'
    | 'trimestre-pasado'
    | 'ultimos-6-meses'
    | 'este-ano'
    | 'ultimos-12-meses'
    | 'ano-pasado'
    | 'personalizado'

export const DEFAULT_PERIOD: PeriodPresetKey = 'este-mes'

export function localIsoDate(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

function firstOfMonth(year: number, monthIndex: number) {
    return localIsoDate(new Date(year, monthIndex, 1))
}

function lastOfMonth(year: number, monthIndex: number) {
    return localIsoDate(new Date(year, monthIndex + 1, 0))
}

export function resolvePeriod(key: PeriodPresetKey, now = new Date()) {
    const year = now.getFullYear()
    const month = now.getMonth()
    const quarterStart = Math.floor(month / 3) * 3
    const today = localIsoDate(now)

    switch (key) {
        case 'mes-pasado':
            return { from: firstOfMonth(year, month - 1), to: lastOfMonth(year, month - 1) }
        case 'este-trimestre':
            return { from: firstOfMonth(year, quarterStart), to: today }
        case 'trimestre-pasado':
            return {
                from: firstOfMonth(year, quarterStart - 3),
                to: lastOfMonth(year, quarterStart - 1),
            }
        case 'ultimos-6-meses':
            return { from: firstOfMonth(year, month - 5), to: today }
        case 'este-ano':
            return { from: firstOfMonth(year, 0), to: today }
        case 'ultimos-12-meses':
            return { from: firstOfMonth(year, month - 11), to: today }
        case 'ano-pasado':
            return { from: firstOfMonth(year - 1, 0), to: lastOfMonth(year - 1, 11) }
        default:
            return { from: firstOfMonth(year, month), to: today }
    }
}

const PRESET_LABELS: { value: PeriodPresetKey; label: string }[] = [
    { value: 'este-mes', label: 'Este mes' },
    { value: 'mes-pasado', label: 'Mes pasado' },
    { value: 'este-trimestre', label: 'Este trimestre' },
    { value: 'trimestre-pasado', label: 'Trimestre pasado' },
    { value: 'ultimos-6-meses', label: 'Últimos 6 meses' },
    { value: 'este-ano', label: 'Este año' },
    { value: 'ultimos-12-meses', label: 'Últimos 12 meses' },
    { value: 'ano-pasado', label: 'Año pasado' },
]

export function isPeriodPreset(value: unknown): value is PeriodPresetKey {
    return value === 'personalizado' || PRESET_LABELS.some((preset) => preset.value === value)
}

export function rangeLabel(from: string, to: string) {
    const sameYear = from.slice(0, 4) === to.slice(0, 4)
    const start = formatLocalIsoDate(
        from,
        sameYear
            ? { day: 'numeric', month: 'short' }
            : { day: 'numeric', month: 'short', year: 'numeric' },
    )
    const end = formatLocalIsoDate(to, { day: 'numeric', month: 'short', year: 'numeric' })
    return from === to ? end : `${start} – ${end}`
}

export function periodOptions(now = new Date()) {
    return [
        ...PRESET_LABELS.map((preset) => {
            const range = resolvePeriod(preset.value, now)
            return { ...preset, description: rangeLabel(range.from, range.to) }
        }),
        {
            value: 'personalizado' as const,
            label: 'Personalizado',
            description: 'Elige las fechas en el calendario',
        },
    ]
}
