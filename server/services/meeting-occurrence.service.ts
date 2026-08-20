import { createError } from 'h3'
import type {
    BulkRecordOccurrencesDto,
    OccurrenceFiltersDto,
    OccurrenceScopeFilter,
    RecordOccurrenceDto,
    UpdateOccurrenceDto,
} from '../dto/offering/occurrence.dto'
import * as repo from '../repositories/occurrence.repository'
import { findAttendanceTypeIdsByIds } from '../repositories/attendance.repository'
import { findOfferingCategoryIdsByIds } from '../repositories/offering.repository'
import { ApiErrorCode } from '../types/api-response.types'
import {
    expectedDatesFor,
    isoDateMonthsAgo,
    todayIsoDate,
    type MonthlyModeValue,
    type RecurrenceFrequency,
} from '../utils/date/recurrence.util'
import { hasOccurrenceEnded } from '../utils/date/business-time.util'

/// Cuánto historial se reconstruye la primera vez que se sincroniza una reunión.
const GENERATION_FLOOR_MONTHS = 3

const FREQUENCY_FROM_DB: Record<string, RecurrenceFrequency> = {
    ONCE: 'unica',
    DAILY: 'diaria',
    WEEKLY: 'semanal',
    BIWEEKLY: 'quincenal',
    MONTHLY: 'mensual',
}

const MONTHLY_MODE_FROM_DB: Record<string, MonthlyModeValue> = {
    FIXED_DAY: 'dia_fijo',
    ORDINAL: 'ordinal',
}

function resourceNotFound(): never {
    throw createError({
        statusCode: 404,
        message: 'La ocurrencia solicitada no existe',
        data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
    })
}

function businessRule(message: string): never {
    throw createError({
        statusCode: 409,
        message,
        data: { code: ApiErrorCode.BUSINESS_RULE_ERROR },
    })
}

function forbidden(message: string): never {
    throw createError({
        statusCode: 403,
        message,
        data: { code: ApiErrorCode.FORBIDDEN },
    })
}

function toIsoDate(value: Date) {
    return value.toISOString().slice(0, 10)
}

function maxIsoDate(left: string, right: string) {
    return left > right ? left : right
}

function assertOccurrenceEnded(occurrence: repo.OccurrenceRecord, now = new Date()): void {
    if (hasOccurrenceEnded(occurrence, now)) return

    businessRule(
        `La reunión ${occurrence.meetingTitle} del ${occurrence.date} todavía no ha terminado; ` +
            `podrás registrar la ofrenda y la asistencia después de las ${occurrence.endTime}`,
    )
}

async function assertCategoriesExist(details: { categoryId: number }[]) {
    if (details.length === 0) return
    const ids = [...new Set(details.map((detail) => detail.categoryId))]
    const existing = await findOfferingCategoryIdsByIds(ids)
    if (existing.length !== ids.length) {
        businessRule('Una o más categorías de ofrenda no existen')
    }
}

async function assertAttendanceTypesExist(details: { typeId: number }[]) {
    if (details.length === 0) return
    const ids = [...new Set(details.map((detail) => detail.typeId))]
    const existing = await findAttendanceTypeIdsByIds(ids)
    if (existing.length !== ids.length) {
        businessRule('Uno o más tipos de asistencia no existen')
    }
}

/**
 * Materializa las fechas que la regla de recurrencia debía producir hasta hoy y que
 * todavía no existen como fila. Nunca genera fechas futuras: una fecha que no ha
 * ocurrido no es un pendiente.
 */
export async function syncOccurrences(options: { meetingIds?: number[] } = {}, now = new Date()) {
    const today = todayIsoDate(now)
    const floor = isoDateMonthsAgo(today, GENERATION_FLOOR_MONTHS)
    const meetings = await repo.findMeetingsForGeneration(options.meetingIds)

    const rows = meetings.flatMap((meeting) => {
        const anchor = toIsoDate(meeting.date)
        const dates = expectedDatesFor(
            {
                anchorDate: anchor,
                frequency: FREQUENCY_FROM_DB[meeting.frequency] ?? 'unica',
                endDate: meeting.recurrenceEndDate ? toIsoDate(meeting.recurrenceEndDate) : null,
                monthlyMode: meeting.monthlyMode
                    ? MONTHLY_MODE_FROM_DB[meeting.monthlyMode]!
                    : null,
                weekOrdinal: meeting.weekOrdinal,
                weekday: meeting.weekday,
            },
            maxIsoDate(floor, anchor),
            today,
        )

        return dates.map((date) => ({
            meetingId: meeting.id,
            date,
            sectorId: meeting.sectorId,
            leaderId: meeting.leaderId,
        }))
    })

    const created = await repo.createMissingOccurrences(rows)
    return { created, meetings: meetings.length }
}

/// Al cambiar la recurrencia se descartan los pendientes y se regeneran; lo registrado no se toca.
export async function resyncMeetingOccurrences(meetingId: number) {
    await repo.deletePendingOccurrences(meetingId)
    return syncOccurrences({ meetingIds: [meetingId] })
}

export async function getPendingOccurrences(scope: OccurrenceScopeFilter, now = new Date()) {
    await syncOccurrences({}, now)
    const occurrences = await repo.findPendingOccurrences(scope)
    return occurrences.filter((occurrence) => hasOccurrenceEnded(occurrence, now))
}

export function getOccurrences(scope: OccurrenceScopeFilter, filters: OccurrenceFiltersDto = {}) {
    return repo.findOccurrences(scope, filters)
}

/// Carga una ocurrencia comprobando que caiga dentro del alcance del usuario.
async function getScopedOccurrence(id: number, scope: OccurrenceScopeFilter) {
    const occurrence = await repo.findOccurrenceById(id)
    if (!occurrence) resourceNotFound()

    const allowed =
        scope.seesAll ||
        scope.sectorIds.includes(occurrence.sectorId) ||
        scope.meetingIds.includes(occurrence.meetingId)

    if (!allowed) forbidden('No tienes acceso a esta reunión')

    return occurrence
}

export function getOccurrenceById(id: number, scope: OccurrenceScopeFilter) {
    return getScopedOccurrence(id, scope)
}

/**
 * Captura una ocurrencia pendiente. Registrar es una sola vez: corregir lo ya
 * capturado exige `finance.manage`, que es lo que impide al líder reescribir su
 * propio registro.
 */
export async function recordOccurrence(
    id: number,
    dto: RecordOccurrenceDto,
    scope: OccurrenceScopeFilter,
    userId: number,
) {
    const occurrence = await getScopedOccurrence(id, scope)

    if (occurrence.status === 'registrada') {
        businessRule('Esta fecha ya fue registrada; solo un supervisor puede corregirla')
    }

    assertOccurrenceEnded(occurrence)

    await assertCategoriesExist(dto.details)
    await assertAttendanceTypesExist(dto.attendanceDetails)
    return repo.recordOccurrence(id, dto, userId)
}

/// Guardado parcial: registrar 2 de 4 pendientes es un caso normal, no un error.
export async function recordOccurrencesBulk(
    dto: BulkRecordOccurrencesDto,
    scope: OccurrenceScopeFilter,
    userId: number,
) {
    const ids = dto.entries.map((entry) => entry.occurrenceId)
    if (new Set(ids).size !== ids.length) {
        businessRule('No puedes registrar dos veces la misma fecha en el mismo envío')
    }

    const occurrences = await Promise.all(ids.map((id) => getScopedOccurrence(id, scope)))

    const alreadyRecorded = occurrences.find((occurrence) => occurrence.status === 'registrada')
    if (alreadyRecorded) {
        businessRule(
            `La fecha ${alreadyRecorded.date} de ${alreadyRecorded.meetingTitle} ya fue registrada`,
        )
    }

    const now = new Date()
    for (const occurrence of occurrences) assertOccurrenceEnded(occurrence, now)

    await assertCategoriesExist(dto.entries.flatMap((entry) => entry.details))
    await assertAttendanceTypesExist(dto.entries.flatMap((entry) => entry.attendanceDetails))
    return repo.recordOccurrencesBulk(dto.entries, userId)
}

/// Corrección de una ocurrencia ya registrada. Requiere `finance.manage` en el handler.
export async function updateOccurrence(
    id: number,
    dto: UpdateOccurrenceDto,
    scope: OccurrenceScopeFilter,
    userId: number,
) {
    const occurrence = await getScopedOccurrence(id, scope)

    if (occurrence.status !== 'registrada') {
        businessRule('Esta fecha todavía no ha sido registrada')
    }

    if (dto.details !== undefined) await assertCategoriesExist(dto.details)
    if (dto.attendanceDetails !== undefined) await assertAttendanceTypesExist(dto.attendanceDetails)
    return repo.updateOccurrence(id, dto, userId)
}
