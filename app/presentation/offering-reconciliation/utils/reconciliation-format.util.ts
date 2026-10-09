import type { ReconciliationStatus } from '../interfaces/reconciliation.interface'

export const RECONCILIATION_HOME = '/finanzas/conciliacion'
export const RECONCILIATION_ENVELOPES = `${RECONCILIATION_HOME}/sobres`
export const RECONCILIATION_LEADERS = `${RECONCILIATION_HOME}/lideres`

export function reconciliationEnvelopePath(occurrenceId: number) {
    return `${RECONCILIATION_ENVELOPES}/${occurrenceId}`
}

export const RECONCILIATION_STATUSES: {
    value: ReconciliationStatus
    label: string
    plural: string
    badgeClass: string
    dotClass: string
}[] = [
    {
        value: 'diferencia_abierta',
        label: 'Diferencia abierta',
        plural: 'Diferencias abiertas',
        badgeClass: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        dotClass: 'bg-amber-500',
    },
    {
        value: 'sin_entregar',
        label: 'Sin entregar',
        plural: 'Sin entregar',
        badgeClass: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
        dotClass: 'bg-rose-500',
    },
    {
        value: 'diferencia_cerrada',
        label: 'Revisada',
        plural: 'Revisadas',
        badgeClass: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
        dotClass: 'bg-sky-500',
    },
    {
        value: 'cuadra',
        label: 'Cuadra',
        plural: 'Cuadran',
        badgeClass:
            'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        dotClass: 'bg-emerald-500',
    },
]

export function statusMeta(status: ReconciliationStatus) {
    return RECONCILIATION_STATUSES.find((item) => item.value === status)!
}

export function isReconciliationStatus(value: unknown): value is ReconciliationStatus {
    return RECONCILIATION_STATUSES.some((item) => item.value === value)
}

export function pendingLabel(days: number | null) {
    if (days === null) return ''
    if (days === 0) return 'hoy'
    if (days === 1) return '1 día'
    return `${days} días`
}

function csvCell(value: string | number | null | undefined) {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function downloadCsv(
    fileName: string,
    header: string[],
    rows: (string | number | null)[][],
) {
    const content = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
    const blob = new Blob([String.fromCharCode(0xfeff), content], {
        type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
}
