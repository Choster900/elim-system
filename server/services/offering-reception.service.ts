import { createError } from 'h3'
import type { OccurrenceScopeFilter } from '../dto/offering/occurrence.dto'
import type {
    PendingEnvelopesFiltersDto,
    ReceiveEnvelopeDto,
    ReceptionCountDto,
    ReceptionFiltersDto,
    ReceptionStatus,
    ReceptionWriteDto,
} from '../dto/offering/reception.dto'
import {
    findActiveDenominations,
    findDenominationsByIds,
    type DenominationRecord,
} from '../repositories/denomination.repository'
import {
    findOfferingCategories,
    findOfferingCategoriesByIds,
} from '../repositories/offering.repository'
import type { OccurrenceRecord } from '../repositories/occurrence.repository'
import * as repo from '../repositories/reception.repository'
import { ApiErrorCode } from '../types/api-response.types'
import { hasOccurrenceEnded } from '../utils/date/business-time.util'
import { getOccurrenceById, syncOccurrences } from './meeting-occurrence.service'

interface RegisteredCategory {
    categoryId: number | null
    categoryName: string | null
    cents: number
}

function businessRule(message: string): never {
    throw createError({
        statusCode: 409,
        message,
        data: { code: ApiErrorCode.BUSINESS_RULE_ERROR },
    })
}

function notFound(message: string): never {
    throw createError({
        statusCode: 404,
        message,
        data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
    })
}

function toCents(value: number) {
    return Math.round(value * 100)
}

function fromCents(cents: number) {
    return cents / 100
}

function registeredCategories(occurrence: OccurrenceRecord): RegisteredCategory[] {
    if (occurrence.details.length > 0) {
        return occurrence.details.map((detail) => ({
            categoryId: detail.categoryId,
            categoryName: detail.categoryName,
            cents: toCents(detail.amount),
        }))
    }

    return [{ categoryId: null, categoryName: null, cents: toCents(occurrence.totalAmount ?? 0) }]
}

function needsDirectEntry(occurrence: OccurrenceRecord) {
    return occurrence.isGeneralMeeting && occurrence.status !== 'registrada'
}

export function toEnvelope(occurrence: OccurrenceRecord) {
    const directEntry = needsDirectEntry(occurrence)
    return {
        isGeneral: occurrence.isGeneralMeeting,
        directEntry,
        isReady: !directEntry || hasOccurrenceEnded(occurrence),
        occurrenceId: occurrence.id,
        meetingId: occurrence.meetingId,
        meetingTitle: occurrence.meetingTitle,
        meetingCode: occurrence.meetingCode,
        meetingColor: occurrence.meetingColor,
        meetingTypeName: occurrence.meetingTypeName,
        date: occurrence.date,
        startTime: occurrence.startTime,
        endTime: occurrence.endTime,
        leaderName: occurrence.leaderName,
        sectorId: occurrence.sectorId,
        sectorName: occurrence.sectorName,
        zoneId: occurrence.zoneId,
        zoneName: occurrence.zoneName,
        districtId: occurrence.districtId,
        districtName: occurrence.districtName,
        recordedByName: occurrence.recordedByName,
        recordedAt: occurrence.recordedAt,
        categories: directEntry
            ? []
            : registeredCategories(occurrence).map(({ categoryId, categoryName }) => ({
                  categoryId,
                  categoryName,
              })),
    }
}

function toReceptionSummary(reception: repo.ReceptionRecord) {
    const { occurrence, ...rest } = reception
    return { ...rest, envelope: toEnvelope(occurrence) }
}

async function getReceivableOccurrence(
    occurrenceId: number,
    scope: OccurrenceScopeFilter,
    now = new Date(),
) {
    const occurrence = await getOccurrenceById(occurrenceId, scope)
    if (occurrence.status === 'registrada') return occurrence
    if (!occurrence.isGeneralMeeting) {
        businessRule('El líder todavía no registra la ofrenda de esta fecha')
    }
    if (!hasOccurrenceEnded(occurrence, now)) {
        businessRule(
            `El culto todavía no termina; podrás registrar su ofrenda después de las ${occurrence.endTime}`,
        )
    }
    return occurrence
}

async function resolveDenominations(dto: ReceptionCountDto) {
    const ids = [
        ...new Set(
            dto.categories.flatMap((category) => category.counts.map((c) => c.denominationId)),
        ),
    ]
    if (ids.length === 0) return new Map<number, DenominationRecord>()

    const denominations = await findDenominationsByIds(ids)
    if (denominations.length !== ids.length) {
        businessRule('Una o más denominaciones no existen')
    }
    return new Map(denominations.map((denomination) => [denomination.id, denomination]))
}

async function resolveCategoryNames(dto: ReceptionCountDto, registered: RegisteredCategory[]) {
    const registeredIds = new Set(registered.map((category) => category.categoryId))
    const extraIds = dto.categories
        .map((category) => category.categoryId)
        .filter((id): id is number => id !== null && !registeredIds.has(id))

    if (
        dto.categories.some((category) => category.categoryId === null && !registeredIds.has(null))
    ) {
        businessRule('Indica el tipo de ofrenda de cada conteo')
    }

    const names = new Map<number | null, string | null>(
        registered.map((category) => [category.categoryId, category.categoryName]),
    )
    if (extraIds.length === 0) return names

    const categories = await findOfferingCategoriesByIds(extraIds)
    const activeIds = new Set(categories.filter((c) => c.isActive).map((c) => c.id))
    if (extraIds.some((id) => !activeIds.has(id))) {
        businessRule('Uno o más tipos de ofrenda no existen o están inactivos')
    }
    for (const category of categories) names.set(category.id, category.name)
    return names
}

function assertNoDuplicates(dto: ReceptionCountDto) {
    const categoryIds = dto.categories.map((category) => category.categoryId)
    if (new Set(categoryIds).size !== categoryIds.length) {
        businessRule('Cada tipo de ofrenda solo puede contarse una vez')
    }

    for (const category of dto.categories) {
        const denominationIds = category.counts.map((count) => count.denominationId)
        if (new Set(denominationIds).size !== denominationIds.length) {
            businessRule('Cada denominación solo puede aparecer una vez por tipo de ofrenda')
        }
    }
}

async function buildComparison(
    occurrence: OccurrenceRecord,
    dto: ReceptionCountDto,
    direct = false,
) {
    assertNoDuplicates(dto)

    const registered = direct ? [] : registeredCategories(occurrence)
    const [denominations, names] = await Promise.all([
        resolveDenominations(dto),
        resolveCategoryNames(dto, registered),
    ])

    const counted = new Map(
        dto.categories.map((category) => [
            category.categoryId,
            category.counts
                .filter((count) => count.quantity > 0)
                .map((count) => {
                    const denomination = denominations.get(count.denominationId)!
                    return {
                        denomination,
                        quantity: count.quantity,
                        cents: toCents(denomination.value) * count.quantity,
                    }
                })
                .sort((left, right) => left.denomination.sortOrder - right.denomination.sortOrder),
        ]),
    )

    const categoryIds = [
        ...registered.map((category) => category.categoryId),
        ...dto.categories
            .map((category) => category.categoryId)
            .filter(
                (id) =>
                    !registered.some((category) => category.categoryId === id) &&
                    (counted.get(id)?.length ?? 0) > 0,
            ),
    ]

    const categories = categoryIds.map((categoryId) => {
        const counts = counted.get(categoryId) ?? []
        const countedCents = counts.reduce((sum, count) => sum + count.cents, 0)
        const registeredCents = direct
            ? countedCents
            : (registered.find((category) => category.categoryId === categoryId)?.cents ?? 0)

        return {
            categoryId,
            categoryName: names.get(categoryId) ?? null,
            registeredCents,
            countedCents,
            counts,
        }
    })

    const registeredCents = categories.reduce((sum, category) => sum + category.registeredCents, 0)
    const countedCents = categories.reduce((sum, category) => sum + category.countedCents, 0)
    const status: ReceptionStatus = categories.every(
        (category) => category.registeredCents === category.countedCents,
    )
        ? 'cuadra'
        : 'con_diferencia'

    return {
        status,
        registeredAmount: fromCents(registeredCents),
        countedAmount: fromCents(countedCents),
        difference: fromCents(countedCents - registeredCents),
        categories: categories.map((category) => ({
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            registeredAmount: fromCents(category.registeredCents),
            countedAmount: fromCents(category.countedCents),
            difference: fromCents(category.countedCents - category.registeredCents),
            counts: category.counts.map((count) => ({
                denomination: count.denomination,
                quantity: count.quantity,
                amount: fromCents(count.cents),
            })),
        })),
    }
}

type Comparison = Awaited<ReturnType<typeof buildComparison>>

function toWriteDto(comparison: Comparison, rawNotes: string | null): ReceptionWriteDto {
    const notes = rawNotes?.trim() || null
    if (comparison.status === 'con_diferencia' && !notes) {
        businessRule(
            'El conteo no cuadra con lo registrado; escribe una observación que lo explique',
        )
    }

    return {
        systemAmount: comparison.registeredAmount,
        receivedAmount: comparison.countedAmount,
        amountDifference: comparison.difference,
        status: comparison.status,
        notes,
        categories: comparison.categories.map((category) => ({
            categoryId: category.categoryId,
            systemAmount: category.registeredAmount,
            amount: category.countedAmount,
            counts: category.counts.map((count) => ({
                denominationId: count.denomination.id,
                quantity: count.quantity,
                amount: count.amount,
            })),
        })),
    }
}

export function getDenominations() {
    return findActiveDenominations()
}

export async function getPendingEnvelopes(
    scope: OccurrenceScopeFilter,
    filters: PendingEnvelopesFiltersDto,
    page: { skip: number; take: number },
) {
    if (page.skip === 0) await syncOccurrences()
    const [{ items, totalItems }, zones] = await Promise.all([
        repo.findPendingEnvelopeOccurrences(scope, filters, page),
        repo.findPendingEnvelopeZones(scope),
    ])
    return { items: items.map(toEnvelope), zones, totalItems }
}

export async function getReceptions(scope: OccurrenceScopeFilter, filters: ReceptionFiltersDto) {
    const receptions = await repo.findReceptions(scope, filters)
    return receptions.map(toReceptionSummary)
}

export async function getEnvelope(occurrenceId: number, scope: OccurrenceScopeFilter) {
    const occurrence = await getReceivableOccurrence(occurrenceId, scope)
    const [reception, categories] = await Promise.all([
        repo.findReceptionByOccurrenceId(occurrenceId),
        findOfferingCategories(),
    ])
    return {
        envelope: toEnvelope(occurrence),
        reception: reception ? toReceptionSummary(reception) : null,
        availableCategories: categories
            .filter((category) => category.isActive)
            .map((category) => ({ categoryId: category.id, categoryName: category.name })),
    }
}

export async function compareEnvelope(
    occurrenceId: number,
    dto: ReceptionCountDto,
    scope: OccurrenceScopeFilter,
) {
    const occurrence = await getReceivableOccurrence(occurrenceId, scope)
    const existing = await repo.findReceptionByOccurrenceId(occurrenceId)
    return buildComparison(occurrence, dto, needsDirectEntry(occurrence) || !!existing?.directEntry)
}

export async function receiveEnvelope(
    occurrenceId: number,
    dto: ReceiveEnvelopeDto,
    scope: OccurrenceScopeFilter,
    userId: number,
) {
    const occurrence = await getReceivableOccurrence(occurrenceId, scope)
    if (await repo.findReceptionIdByOccurrenceId(occurrenceId)) {
        businessRule('Este sobre ya fue recibido; ábrelo desde Recibidos si necesitas corregirlo')
    }

    const direct = needsDirectEntry(occurrence)
    const comparison = await buildComparison(occurrence, dto, direct)
    const write = toWriteDto(comparison, dto.notes)
    const reception = direct
        ? await repo.createDirectReception(occurrenceId, write, userId)
        : await repo.createReception(occurrenceId, write, userId)
    return toReceptionSummary(reception)
}

export async function correctReception(
    occurrenceId: number,
    dto: ReceiveEnvelopeDto,
    scope: OccurrenceScopeFilter,
    userId: number,
) {
    const occurrence = await getReceivableOccurrence(occurrenceId, scope)
    const existing = await repo.findReceptionByOccurrenceId(occurrenceId)
    if (!existing) notFound('Este sobre todavía no ha sido recibido')
    if (existing.closedAt) {
        businessRule('Finanzas ya revisó y cerró este sobre; no se puede corregir')
    }
    const receptionId = existing.id

    const comparison = await buildComparison(occurrence, dto, existing.directEntry)
    const write = toWriteDto(comparison, dto.notes)
    const reception = existing.directEntry
        ? await repo.updateDirectReception(receptionId, occurrenceId, write, userId)
        : await repo.updateReception(receptionId, write, userId)
    return toReceptionSummary(reception)
}
