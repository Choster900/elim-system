import { parseDate, type DateValue } from '@internationalized/date'

export function toDateValue(isoDate: string | null | undefined): DateValue | undefined {
    if (!isoDate) {
        return undefined
    }

    try {
        return parseDate(isoDate)
    } catch {
        return undefined
    }
}

export function fromDateValue(dateValue: DateValue | null | undefined) {
    return dateValue?.toString() ?? null
}
