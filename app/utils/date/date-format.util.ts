const DEFAULT_DATE_LOCALE = 'es-SV'

export function parseLocalIsoDate(isoDate: string | null | undefined) {
    if (!isoDate) {
        return null
    }

    const date = new Date(`${isoDate}T00:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
}

export function formatLocalIsoDate(
    isoDate: string | null | undefined,
    options: Intl.DateTimeFormatOptions,
    locale = DEFAULT_DATE_LOCALE,
    fallback = isoDate ?? '',
) {
    const date = parseLocalIsoDate(isoDate)
    if (!date) {
        return fallback
    }

    try {
        return date.toLocaleDateString(locale, options)
    } catch {
        return fallback
    }
}

export function formatShortIsoDate(
    isoDate: string | null | undefined,
    locale = DEFAULT_DATE_LOCALE,
) {
    return formatLocalIsoDate(
        isoDate,
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        },
        locale,
    )
}

export function getLocalIsoDateDay(isoDate: string | null | undefined) {
    return parseLocalIsoDate(isoDate)?.getDate() ?? null
}

export function toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10)
}

export function offsetIsoDate(days: number, baseDate = new Date()) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + days)
    return toIsoDate(date)
}

function parseTime(time: string) {
    const match = /^(\d{1,2}):(\d{2})/.exec(time ?? '')
    if (!match) return null
    const hours = Number(match[1])
    const minutes = Number(match[2])
    return hours < 24 && minutes < 60 ? { hours, minutes } : null
}

function to12Hour({ hours, minutes }: { hours: number; minutes: number }) {
    return {
        clock: `${hours % 12 || 12}:${String(minutes).padStart(2, '0')}`,
        period: hours < 12 ? 'a. m.' : 'p. m.',
    }
}

// "19:00" → "7:00 p. m."
export function formatTime12h(time: string) {
    const parsed = parseTime(time)
    if (!parsed) return time
    const { clock, period } = to12Hour(parsed)
    return `${clock} ${period}`
}

// "19:00"–"20:30" → "7:00 – 8:30 p. m."; "11:00"–"13:00" → "11:00 a. m. – 1:00 p. m."
export function formatTimeRange(startTime: string, endTime: string) {
    const start = parseTime(startTime)
    const end = parseTime(endTime)
    if (!start || !end) return `${startTime} – ${endTime}`

    const from = to12Hour(start)
    const to = to12Hour(end)
    return from.period === to.period
        ? `${from.clock} – ${to.clock} ${to.period}`
        : `${from.clock} ${from.period} – ${to.clock} ${to.period}`
}

// "19:00"–"20:30" → "1 h 30 min"
export function formatTimeDuration(startTime: string, endTime: string) {
    const start = parseTime(startTime)
    const end = parseTime(endTime)
    if (!start || !end) return ''

    const total = end.hours * 60 + end.minutes - (start.hours * 60 + start.minutes)
    if (total <= 0) return ''
    const hours = Math.floor(total / 60)
    const minutes = total % 60
    if (!hours) return `${minutes} min`
    return minutes ? `${hours} h ${minutes} min` : `${hours} h`
}
