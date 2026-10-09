import { formatLocalIsoDate } from '~/utils/date/date-format.util'
import type { Denomination, ReceptionStatus } from '../interfaces/reception.interface'

export const SUPPORT_COMMITTEE_HOME = '/finanzas/comite-de-apoyo'
export const RECEIVED_ENVELOPES_PATH = `${SUPPORT_COMMITTEE_HOME}/recibidos`

export function envelopePath(occurrenceId: number) {
    return `${SUPPORT_COMMITTEE_HOME}/sobres/${occurrenceId}`
}

export function countPath(occurrenceId: number, correcting = false) {
    return `${envelopePath(occurrenceId)}/contar${correcting ? '?modo=corregir' : ''}`
}

export function reviewPath(occurrenceId: number, correcting = false) {
    return `${envelopePath(occurrenceId)}/revisar${correcting ? '?modo=corregir' : ''}`
}

export function toCents(value: number) {
    return Math.round(value * 100)
}

export function formatMoney(value: number) {
    return `$${value.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function categoryLabel(name: string | null) {
    return name ?? 'Ofrenda (sin tipo)'
}

export function denominationValueLabel(denomination: Pick<Denomination, 'value'>) {
    if (denomination.value >= 1) {
        return Number.isInteger(denomination.value)
            ? `$${denomination.value}`
            : formatMoney(denomination.value)
    }
    return `${Math.round(denomination.value * 100)}¢`
}

export function denominationKindLabel(denomination: Pick<Denomination, 'name' | 'kind'>) {
    if (/^billete/i.test(denomination.name)) return 'Billete'
    if (/^moneda/i.test(denomination.name)) return 'Moneda'
    return denomination.name.replace(/\s*\(.*\)$/, '')
}

export function denominationNickname(denomination: Pick<Denomination, 'name'>) {
    if (/^(billete|moneda)/i.test(denomination.name)) return null
    return denomination.name.replace(/\s*\(.*\)$/, '').toLowerCase()
}

export function countedCents(
    quantities: Record<string, number | null>,
    denominations: Pick<Denomination, 'id' | 'value'>[],
) {
    return denominations.reduce(
        (sum, denomination) =>
            sum + toCents(denomination.value) * (quantities[String(denomination.id)] ?? 0),
        0,
    )
}

export function differenceLabel(difference: number) {
    if (toCents(difference) === 0) return 'Cuadra'
    return difference < 0
        ? `Faltan ${formatMoney(Math.abs(difference))}`
        : `Sobran ${formatMoney(difference)}`
}

export function statusLabel(status: ReceptionStatus) {
    return status === 'cuadra' ? 'Cuadra' : 'Con diferencia'
}

export function longDateLabel(isoDate: string) {
    return formatLocalIsoDate(isoDate, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

export function shortDateLabel(isoDate: string) {
    return formatLocalIsoDate(isoDate, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatDateTime(value: string | null) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString('es-SV', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}
