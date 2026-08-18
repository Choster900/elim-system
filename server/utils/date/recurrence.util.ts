// Cálculo de las fechas en que una reunión debía realizarse.
// Función pura y sin dependencias: toda la aritmética es en UTC sobre fechas ISO
// (yyyy-mm-dd) para que el resultado no dependa de la zona horaria del servidor.

export type RecurrenceFrequency = 'unica' | 'diaria' | 'semanal' | 'quincenal' | 'mensual'
export type MonthlyModeValue = 'dia_fijo' | 'ordinal'

export interface RecurrenceRule {
    /// Fecha inicial de la reunión y ancla del día para la regla.
    anchorDate: string
    frequency: RecurrenceFrequency
    /// Fecha final inclusiva; null indica que no termina.
    endDate: string | null
    monthlyMode: MonthlyModeValue | null
    /// 1 a 4, o 5 para el último día de ese tipo en el mes.
    weekOrdinal: number | null
    /// 0 domingo a 6 sábado.
    weekday: number | null
}

const DAY_MS = 86_400_000
const MAX_MONTH_ITERATIONS = 1200

const STEP_DAYS: Partial<Record<RecurrenceFrequency, number>> = {
    diaria: 1,
    semanal: 7,
    quincenal: 14,
}

function toUtcMs(isoDate: string) {
    const [year, month, day] = isoDate.split('-').map(Number)
    return Date.UTC(year!, month! - 1, day!)
}

function toIsoDate(utcMs: number) {
    return new Date(utcMs).toISOString().slice(0, 10)
}

function daysInMonth(year: number, monthIndex: number) {
    return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

/// Fecha de la recurrencia mensual dentro de un mes concreto, o null si ese mes no la tiene.
function monthlyCandidate(rule: RecurrenceRule, year: number, monthIndex: number): number | null {
    const usesOrdinal =
        rule.monthlyMode === 'ordinal' && rule.weekOrdinal !== null && rule.weekday !== null

    if (!usesOrdinal) {
        const anchorDay = new Date(toUtcMs(rule.anchorDate)).getUTCDate()
        // En meses cortos se ajusta al último día disponible.
        const day = Math.min(anchorDay, daysInMonth(year, monthIndex))
        return Date.UTC(year, monthIndex, day)
    }

    const total = daysInMonth(year, monthIndex)

    if (rule.weekOrdinal === 5) {
        // El último día de ese tipo en el mes.
        for (let day = total; day >= total - 6; day -= 1) {
            const candidate = Date.UTC(year, monthIndex, day)
            if (new Date(candidate).getUTCDay() === rule.weekday) return candidate
        }
        return null
    }

    const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay()
    const offset = (rule.weekday! - firstWeekday + 7) % 7
    const day = 1 + offset + (rule.weekOrdinal! - 1) * 7

    // Un mes puede no tener, por ejemplo, un quinto sábado.
    return day > total ? null : Date.UTC(year, monthIndex, day)
}

/**
 * Fechas esperadas de la reunión dentro de la ventana [from, to], ambas inclusivas.
 * Nunca devuelve fechas anteriores al ancla ni posteriores a la fecha de fin.
 */
export function expectedDatesFor(rule: RecurrenceRule, from: string, to: string): string[] {
    const anchorMs = toUtcMs(rule.anchorDate)
    const startMs = Math.max(toUtcMs(from), anchorMs)
    const limitMs =
        rule.endDate === null ? toUtcMs(to) : Math.min(toUtcMs(to), toUtcMs(rule.endDate))

    if (limitMs < startMs) return []

    if (rule.frequency === 'unica') {
        return anchorMs >= startMs && anchorMs <= limitMs ? [toIsoDate(anchorMs)] : []
    }

    const stepDays = STEP_DAYS[rule.frequency]

    if (stepDays !== undefined) {
        const stepMs = stepDays * DAY_MS
        // Salto directo al primer múltiplo dentro de la ventana, sin recorrer desde el ancla.
        const skipped = Math.ceil((startMs - anchorMs) / stepMs)
        const dates: string[] = []

        for (let cursor = anchorMs + skipped * stepMs; cursor <= limitMs; cursor += stepMs) {
            dates.push(toIsoDate(cursor))
        }

        return dates
    }

    const dates: string[] = []
    const cursor = new Date(startMs)
    let year = cursor.getUTCFullYear()
    let monthIndex = cursor.getUTCMonth()

    for (let iteration = 0; iteration < MAX_MONTH_ITERATIONS; iteration += 1) {
        const candidate = monthlyCandidate(rule, year, monthIndex)

        if (candidate !== null) {
            if (candidate > limitMs) break
            if (candidate >= startMs) dates.push(toIsoDate(candidate))
        }

        // Un mes sin candidato no detiene la serie: se sigue al siguiente.
        if (candidate === null && Date.UTC(year, monthIndex, 1) > limitMs) break

        monthIndex += 1
        if (monthIndex > 11) {
            monthIndex = 0
            year += 1
        }
    }

    return dates
}

/// Fecha de hoy en ISO, en la zona horaria del servidor.
export function todayIsoDate() {
    const now = new Date()
    return toIsoDate(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

/// Desplaza una fecha ISO hacia atrás un número de meses.
export function isoDateMonthsAgo(isoDate: string, months: number) {
    const [year, month, day] = isoDate.split('-').map(Number)
    const target = new Date(Date.UTC(year!, month! - 1 - months, 1))
    const clampedDay = Math.min(day!, daysInMonth(target.getUTCFullYear(), target.getUTCMonth()))
    return toIsoDate(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), clampedDay))
}
