import type {
    Envelope,
    ReceptionRecord,
} from '~/presentation/support-committee/interfaces/reception.interface'

export type ReconciliationStatus =
    'cuadra' | 'diferencia_abierta' | 'diferencia_cerrada' | 'sin_entregar'

export interface ReconciliationFilters {
    from: string
    to: string
    zoneId?: number
}

export interface ReconciliationEnvelope {
    occurrenceId: number
    meetingId: number
    meetingTitle: string
    meetingCode: string
    meetingColor: string
    date: string
    leaderId: number | null
    leaderName: string | null
    sectorId: number | null
    sectorName: string | null
    zoneId: number | null
    zoneName: string | null
    status: ReconciliationStatus
    registeredAmount: number
    countedAmount: number | null
    difference: number | null
    recordedAt: string | null
    receivedAt: string | null
    receivedByName: string | null
    closedAt: string | null
    closedByName: string | null
    directEntry: boolean
    pendingDays: number | null
}

export interface ReconciliationTotals {
    envelopes: number
    registeredAmount: number
    deliveredRegisteredAmount: number
    receivedAmount: number
    difference: number
    undeliveredAmount: number
    counts: Record<ReconciliationStatus, number>
}

export interface ReconciliationTypeRow {
    categoryId: number | null
    categoryName: string | null
    registeredAmount: number
    countedAmount: number
    difference: number
}

export interface ReconciliationLeaderRow {
    key: string
    leaderId: number | null
    leaderName: string | null
    sectorNames: string[]
    envelopes: number
    registeredAmount: number
    receivedAmount: number
    difference: number
    openDiscrepancies: number
    closedDiscrepancies: number
    undelivered: number
    undeliveredAmount: number
    oldestPendingDays: number | null
}

export interface ReconciliationSummary {
    period: { from: string; to: string }
    zones: { id: number; name: string }[]
    totals: ReconciliationTotals
    byType: ReconciliationTypeRow[]
    byLeader: ReconciliationLeaderRow[]
    envelopes: ReconciliationEnvelope[]
}

export type ReviewReception = Omit<ReceptionRecord, 'envelope'>

export interface EnvelopeReview {
    envelope: Envelope
    status: ReconciliationStatus
    registeredAmount: number
    registered: { categoryId: number | null; categoryName: string | null; amount: number }[]
    pendingDays: number | null
    reception: ReviewReception | null
}
