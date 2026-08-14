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

export function formatTimeRange(startTime: string, endTime: string) {
    return `${startTime} – ${endTime}`
}
