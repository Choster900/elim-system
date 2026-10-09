import { createError } from 'h3'
import type { OccurrenceScopeFilter } from '../dto/offering/occurrence.dto'
import type {
    ReconciliationFiltersDto,
    ReconciliationPeriodDto,
    ReconciliationStatus,
} from '../dto/offering/reconciliation.dto'
import type { OccurrenceRecord } from '../repositories/occurrence.repository'
import {
    findReconciliationRows,
    type ReconciliationRow,
} from '../repositories/reconciliation.repository'
import {
    closeReception,
    findReceptionByOccurrenceId,
    type ReceptionCore,
    type ReceptionRecord,
} from '../repositories/reception.repository'
import { ApiErrorCode } from '../types/api-response.types'
import { businessIsoDate } from '../utils/date/business-time.util'
import { getOccurrenceById } from './meeting-occurrence.service'
import { toEnvelope } from './offering-reception.service'

const MS_PER_DAY = 86_400_000

function businessRule(message: string): never {
    throw createError({
        statusCode: 409,
        message,
        data: { code: ApiErrorCode.BUSINESS_RULE_ERROR },
    })
}

function toCents(value: number) {
    return Math.round(value * 100)
}

function fromCents(cents: number) {
    return cents / 100
}

function daysBetween(fromIso: string, toIso: string) {
    const from = Date.parse(`${fromIso}T00:00:00Z`)
    const to = Date.parse(`${toIso}T00:00:00Z`)
    return Math.max(0, Math.round((to - from) / MS_PER_DAY))
}

function resolvePeriod(
    filters: ReconciliationFiltersDto,
    now = new Date(),
): ReconciliationPeriodDto {
    const today = businessIsoDate(now)
    return {
        from: filters.from?.slice(0, 10) ?? `${today.slice(0, 8)}01`,
        to: filters.to?.slice(0, 10) ?? today,
        zoneId: filters.zoneId,
        sectorId: filters.sectorId,
    }
}

function statusOf(reception: ReceptionCore | null): ReconciliationStatus {
    if (!reception) return 'sin_entregar'
    if (reception.status === 'cuadra') return 'cuadra'
    return reception.closedAt ? 'diferencia_cerrada' : 'diferencia_abierta'
}

function registeredCentsOf(occurrence: OccurrenceRecord) {
    if (occurrence.details.length > 0) {
        return occurrence.details.reduce((sum, detail) => sum + toCents(detail.amount), 0)
    }
    return toCents(occurrence.totalAmount ?? 0)
}

function pendingDaysOf(
    status: ReconciliationStatus,
    occurrence: OccurrenceRecord,
    reception: ReceptionCore | null,
    today: string,
) {
    if (status === 'sin_entregar') {
        const since = occurrence.recordedAt
            ? businessIsoDate(occurrence.recordedAt)
            : occurrence.date
        return daysBetween(since, today)
    }
    if (status === 'diferencia_abierta' && reception) {
        return daysBetween(businessIsoDate(reception.receivedAt), today)
    }
    return null
}

function toEnvelopeRow(row: ReconciliationRow, today: string) {
    const { occurrence, reception } = row
    const status = statusOf(reception)
    const registeredCents = reception
        ? toCents(reception.registeredAmount)
        : registeredCentsOf(occurrence)

    return {
        occurrenceId: occurrence.id,
        meetingId: occurrence.meetingId,
        meetingTitle: occurrence.meetingTitle,
        meetingCode: occurrence.meetingCode,
        meetingColor: occurrence.meetingColor,
        date: occurrence.date,
        leaderId: occurrence.leaderId,
        leaderName: occurrence.leaderName,
        sectorId: occurrence.sectorId,
        sectorName: occurrence.sectorName,
        zoneId: occurrence.zoneId,
        zoneName: occurrence.zoneName,
        status,
        registeredAmount: fromCents(registeredCents),
        countedAmount: reception ? reception.countedAmount : null,
        difference: reception ? reception.difference : null,
        recordedAt: occurrence.recordedAt,
        receivedAt: reception?.receivedAt ?? null,
        receivedByName: reception?.receivedByName ?? null,
        closedAt: reception?.closedAt ?? null,
        closedByName: reception?.closedByName ?? null,
        directEntry: reception?.directEntry ?? false,
        pendingDays: pendingDaysOf(status, occurrence, reception, today),
    }
}

type EnvelopeRow = ReturnType<typeof toEnvelopeRow>

function buildTotals(envelopes: EnvelopeRow[]) {
    let registered = 0
    let deliveredRegistered = 0
    let received = 0
    let undelivered = 0
    const counts: Record<ReconciliationStatus, number> = {
        cuadra: 0,
        diferencia_abierta: 0,
        diferencia_cerrada: 0,
        sin_entregar: 0,
    }

    for (const envelope of envelopes) {
        const registeredCents = toCents(envelope.registeredAmount)
        registered += registeredCents
        counts[envelope.status] += 1
        if (envelope.status === 'sin_entregar') {
            undelivered += registeredCents
        } else {
            deliveredRegistered += registeredCents
            received += toCents(envelope.countedAmount ?? 0)
        }
    }

    return {
        envelopes: envelopes.length,
        registeredAmount: fromCents(registered),
        deliveredRegisteredAmount: fromCents(deliveredRegistered),
        receivedAmount: fromCents(received),
        difference: fromCents(received - deliveredRegistered),
        undeliveredAmount: fromCents(undelivered),
        counts,
    }
}

function buildByType(rows: ReconciliationRow[]) {
    const byType = new Map<
        string,
        {
            categoryId: number | null
            categoryName: string | null
            registered: number
            counted: number
        }
    >()

    for (const { reception } of rows) {
        for (const category of reception?.categories ?? []) {
            const key = String(category.categoryId ?? 'sin-tipo')
            const entry = byType.get(key) ?? {
                categoryId: category.categoryId,
                categoryName: category.categoryName,
                registered: 0,
                counted: 0,
            }
            entry.registered += toCents(category.registeredAmount)
            entry.counted += toCents(category.countedAmount)
            byType.set(key, entry)
        }
    }

    return [...byType.values()]
        .map((entry) => ({
            categoryId: entry.categoryId,
            categoryName: entry.categoryName,
            registeredAmount: fromCents(entry.registered),
            countedAmount: fromCents(entry.counted),
            difference: fromCents(entry.counted - entry.registered),
        }))
        .sort((left, right) => right.registeredAmount - left.registeredAmount)
}

function buildByLeader(envelopes: EnvelopeRow[]) {
    const byLeader = new Map<
        string,
        {
            leaderId: number | null
            leaderName: string | null
            sectors: Set<string>
            envelopes: number
            registered: number
            deliveredRegistered: number
            received: number
            openDiscrepancies: number
            closedDiscrepancies: number
            undelivered: number
            undeliveredAmount: number
            oldestPendingDays: number | null
        }
    >()

    for (const envelope of envelopes) {
        const key = String(envelope.leaderId ?? 'sin-lider')
        const entry = byLeader.get(key) ?? {
            leaderId: envelope.leaderId,
            leaderName: envelope.leaderName,
            sectors: new Set<string>(),
            envelopes: 0,
            registered: 0,
            deliveredRegistered: 0,
            received: 0,
            openDiscrepancies: 0,
            closedDiscrepancies: 0,
            undelivered: 0,
            undeliveredAmount: 0,
            oldestPendingDays: null,
        }
        const registeredCents = toCents(envelope.registeredAmount)

        if (envelope.sectorName) entry.sectors.add(envelope.sectorName)
        entry.envelopes += 1
        entry.registered += registeredCents
        if (envelope.status === 'sin_entregar') {
            entry.undelivered += 1
            entry.undeliveredAmount += registeredCents
        } else {
            entry.deliveredRegistered += registeredCents
            entry.received += toCents(envelope.countedAmount ?? 0)
        }
        if (envelope.status === 'diferencia_abierta') entry.openDiscrepancies += 1
        if (envelope.status === 'diferencia_cerrada') entry.closedDiscrepancies += 1
        if (envelope.pendingDays !== null) {
            entry.oldestPendingDays = Math.max(entry.oldestPendingDays ?? 0, envelope.pendingDays)
        }
        byLeader.set(key, entry)
    }

    return [...byLeader.entries()]
        .map(([key, entry]) => ({
            key,
            leaderId: entry.leaderId,
            leaderName: entry.leaderName,
            sectorNames: [...entry.sectors].sort((a, b) => a.localeCompare(b, 'es')),
            envelopes: entry.envelopes,
            registeredAmount: fromCents(entry.registered),
            receivedAmount: fromCents(entry.received),
            difference: fromCents(entry.received - entry.deliveredRegistered),
            openDiscrepancies: entry.openDiscrepancies,
            closedDiscrepancies: entry.closedDiscrepancies,
            undelivered: entry.undelivered,
            undeliveredAmount: fromCents(entry.undeliveredAmount),
            oldestPendingDays: entry.oldestPendingDays,
        }))
        .sort(
            (left, right) =>
                left.difference - right.difference ||
                right.openDiscrepancies +
                    right.undelivered -
                    (left.openDiscrepancies + left.undelivered),
        )
}

export async function getReconciliation(
    scope: OccurrenceScopeFilter,
    filters: ReconciliationFiltersDto,
    now = new Date(),
) {
    const period = resolvePeriod(filters, now)
    const today = businessIsoDate(now)
    const periodRows = await findReconciliationRows(scope, period)
    const zones = [
        ...new Map(
            periodRows
                .filter((row) => row.occurrence.zoneId !== null)
                .map((row) => [row.occurrence.zoneId!, row.occurrence.zoneName ?? '']),
        ),
    ]
        .map(([id, name]) => ({ id, name }))
        .sort((left, right) => left.name.localeCompare(right.name, 'es'))
    const rows = period.zoneId
        ? periodRows.filter((row) => row.occurrence.zoneId === period.zoneId)
        : periodRows
    const envelopes = rows.map((row) => toEnvelopeRow(row, today))

    return {
        period,
        zones,
        totals: buildTotals(envelopes),
        byType: buildByType(rows),
        byLeader: buildByLeader(envelopes),
        envelopes,
    }
}

function withoutOccurrence({ occurrence: _occurrence, ...core }: ReceptionRecord): ReceptionCore {
    return core
}

async function getRecordedOccurrence(occurrenceId: number, scope: OccurrenceScopeFilter) {
    const occurrence = await getOccurrenceById(occurrenceId, scope)
    if (occurrence.status !== 'registrada') {
        businessRule('El líder todavía no registra la ofrenda de esta fecha')
    }
    return occurrence
}

export async function getEnvelopeReview(
    occurrenceId: number,
    scope: OccurrenceScopeFilter,
    now = new Date(),
) {
    const occurrence = await getRecordedOccurrence(occurrenceId, scope)
    const record = await findReceptionByOccurrenceId(occurrenceId)
    const reception = record ? withoutOccurrence(record) : null
    const status = statusOf(reception)

    return {
        envelope: toEnvelope(occurrence),
        status,
        registeredAmount: fromCents(registeredCentsOf(occurrence)),
        registered:
            occurrence.details.length > 0
                ? occurrence.details.map((detail) => ({
                      categoryId: detail.categoryId as number | null,
                      categoryName: detail.categoryName,
                      amount: detail.amount,
                  }))
                : [{ categoryId: null, categoryName: null, amount: occurrence.totalAmount ?? 0 }],
        pendingDays: pendingDaysOf(status, occurrence, reception, businessIsoDate(now)),
        reception,
    }
}

export async function closeDiscrepancy(
    occurrenceId: number,
    notes: string,
    scope: OccurrenceScopeFilter,
    userId: number,
) {
    await getRecordedOccurrence(occurrenceId, scope)
    const reception = await findReceptionByOccurrenceId(occurrenceId)
    if (!reception) businessRule('El comité todavía no recibe este sobre')
    if (reception.status === 'cuadra')
        businessRule('Este sobre cuadra; no hay diferencia que cerrar')
    if (reception.closedAt) businessRule('Esta diferencia ya fue revisada y cerrada')

    await closeReception(reception.id, notes.trim(), userId)
    return getEnvelopeReview(occurrenceId, scope)
}
