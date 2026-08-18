import type { Prisma } from '@prisma/client'
import { prisma } from '../database/prisma'
import type {
    BulkRecordEntryDto,
    OccurrenceDetailDto,
    OccurrenceFiltersDto,
    OccurrenceScopeFilter,
    RecordOccurrenceDto,
    UpdateOccurrenceDto,
} from '../dto/offering/occurrence.dto'
import { mapPrismaError } from '../utils/database/prisma-error.util'

const occurrenceInclude = {
    meeting: {
        include: {
            type: true,
            sector: { include: { zone: { include: { district: true } } } },
        },
    },
    leader: true,
    recordedBy: { include: { member: true } },
    updatedBy: { include: { member: true } },
    details: { include: { category: true }, orderBy: { category: { sortOrder: 'asc' } } },
} satisfies Prisma.MeetingOccurrenceInclude

type OccurrenceWithRelations = Prisma.MeetingOccurrenceGetPayload<{
    include: typeof occurrenceInclude
}>

function dateOf(iso: string) {
    return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`)
}

function toIsoDate(value: Date) {
    return value.toISOString().slice(0, 10)
}

function round2(value: number) {
    return Math.round(value * 100) / 100
}

/// El desglose manda sobre el total capturado a mano; sin desglose se usa el global.
function resolveTotal(details: OccurrenceDetailDto[], totalAmount: number | null) {
    if (details.length > 0) {
        return round2(details.reduce((sum, detail) => sum + detail.amount, 0))
    }
    return totalAmount === null ? 0 : round2(totalAmount)
}

function personName(
    user: {
        username: string | null
        email: string
        member: { firstName: string; lastName: string } | null
    } | null,
) {
    if (!user) return null
    if (user.member) return [user.member.firstName, user.member.lastName].filter(Boolean).join(' ')
    return user.username ?? user.email
}

export function toOccurrenceRecord(occurrence: OccurrenceWithRelations) {
    const sector = occurrence.meeting.sector

    return {
        id: occurrence.id,
        meetingId: occurrence.meetingId,
        meetingTitle: occurrence.meeting.title,
        meetingTypeName: occurrence.meeting.type?.name ?? null,
        meetingColor: occurrence.meeting.color,
        startTime: occurrence.meeting.startTime.toISOString().slice(11, 16),
        date: toIsoDate(occurrence.date),
        status: occurrence.status === 'RECORDED' ? 'registrada' : 'pendiente',
        attendance: occurrence.attendance,
        totalAmount: occurrence.totalAmount === null ? null : Number(occurrence.totalAmount),
        currency: occurrence.currency,
        notes: occurrence.notes,
        sectorId: occurrence.sectorId,
        sectorName: sector.name,
        zoneId: sector.zone.id,
        zoneName: sector.zone.name,
        districtId: sector.zone.district.id,
        districtName: sector.zone.district.name,
        leaderId: occurrence.leaderId,
        leaderName: occurrence.leader
            ? [occurrence.leader.firstName, occurrence.leader.lastName].filter(Boolean).join(' ')
            : null,
        recordedById: occurrence.recordedById,
        recordedByName: personName(occurrence.recordedBy),
        recordedAt: occurrence.recordedAt,
        updatedById: occurrence.updatedById,
        updatedByName: personName(occurrence.updatedBy),
        details: occurrence.details.map((detail) => ({
            id: detail.id,
            categoryId: detail.categoryId,
            categoryName: detail.category?.name ?? null,
            amount: Number(detail.amount),
            notes: detail.notes,
        })),
        createdAt: occurrence.createdAt,
        updatedAt: occurrence.updatedAt,
    }
}

export type OccurrenceRecord = ReturnType<typeof toOccurrenceRecord>

/// Traduce el alcance del usuario a un filtro de Prisma. Sin alcance no ve nada.
function scopeWhere(scope: OccurrenceScopeFilter): Prisma.MeetingOccurrenceWhereInput {
    if (scope.seesAll) return {}

    const clauses: Prisma.MeetingOccurrenceWhereInput[] = []
    if (scope.sectorIds.length > 0) clauses.push({ sectorId: { in: scope.sectorIds } })
    if (scope.meetingIds.length > 0) clauses.push({ meetingId: { in: scope.meetingIds } })

    if (clauses.length === 0) return { id: { in: [] } }
    return { OR: clauses }
}

function filtersWhere(filters: OccurrenceFiltersDto): Prisma.MeetingOccurrenceWhereInput {
    return {
        ...(filters.meetingId ? { meetingId: filters.meetingId } : {}),
        ...(filters.status
            ? { status: filters.status === 'registrada' ? 'RECORDED' : 'PENDING' }
            : {}),
        ...(filters.from || filters.to
            ? {
                  date: {
                      ...(filters.from ? { gte: dateOf(filters.from) } : {}),
                      ...(filters.to ? { lte: dateOf(filters.to) } : {}),
                  },
              }
            : {}),
    }
}

// --- Generación ---

/// Reuniones activas con los datos que necesita la regla de recurrencia.
export function findMeetingsForGeneration(meetingIds?: number[]) {
    return prisma.meeting.findMany({
        where: {
            isActive: true,
            ...(meetingIds ? { id: { in: meetingIds } } : {}),
        },
        select: {
            id: true,
            date: true,
            recurrenceEndDate: true,
            frequency: true,
            monthlyMode: true,
            weekOrdinal: true,
            weekday: true,
            sectorId: true,
            leaderId: true,
        },
    })
}

/// Inserta solo las fechas que faltan; el índice único la hace idempotente.
export async function createMissingOccurrences(
    rows: { meetingId: number; date: string; sectorId: number; leaderId: number | null }[],
) {
    if (rows.length === 0) return 0

    const result = await prisma.meetingOccurrence
        .createMany({
            data: rows.map((row) => ({
                meetingId: row.meetingId,
                date: dateOf(row.date),
                sectorId: row.sectorId,
                leaderId: row.leaderId,
            })),
            skipDuplicates: true,
        })
        .catch(mapPrismaError)

    return result.count
}

/// Al cambiar la recurrencia solo se descartan las fechas que nadie capturó.
export function deletePendingOccurrences(meetingId: number) {
    return prisma.meetingOccurrence
        .deleteMany({ where: { meetingId, status: 'PENDING' } })
        .catch(mapPrismaError)
}

// --- Consulta ---

export async function findOccurrences(
    scope: OccurrenceScopeFilter,
    filters: OccurrenceFiltersDto = {},
) {
    const occurrences = await prisma.meetingOccurrence.findMany({
        where: { AND: [scopeWhere(scope), filtersWhere(filters)] },
        include: occurrenceInclude,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
    })
    return occurrences.map(toOccurrenceRecord)
}

/// Pendientes en orden ascendente: lo más atrasado primero.
export async function findPendingOccurrences(scope: OccurrenceScopeFilter, from?: string) {
    const occurrences = await prisma.meetingOccurrence.findMany({
        where: {
            AND: [
                scopeWhere(scope),
                { status: 'PENDING' },
                from ? { date: { gte: dateOf(from) } } : {},
            ],
        },
        include: occurrenceInclude,
        orderBy: [{ date: 'asc' }, { id: 'asc' }],
    })
    return occurrences.map(toOccurrenceRecord)
}

export async function findOccurrenceById(id: number) {
    const occurrence = await prisma.meetingOccurrence.findUnique({
        where: { id },
        include: occurrenceInclude,
    })
    return occurrence ? toOccurrenceRecord(occurrence) : null
}

// --- Captura ---

function recordData(dto: RecordOccurrenceDto, userId: number | null) {
    return {
        status: 'RECORDED' as const,
        attendance: dto.attendance,
        totalAmount: resolveTotal(dto.details, dto.totalAmount),
        currency: dto.currency,
        notes: dto.notes,
        recordedById: userId,
        recordedAt: new Date(),
        details: {
            deleteMany: {},
            create: dto.details.map((detail) => ({
                categoryId: detail.categoryId,
                amount: detail.amount,
                notes: detail.notes,
            })),
        },
    }
}

export function recordOccurrence(id: number, dto: RecordOccurrenceDto, userId: number | null) {
    return prisma.meetingOccurrence
        .update({ where: { id }, data: recordData(dto, userId), include: occurrenceInclude })
        .then(toOccurrenceRecord)
        .catch(mapPrismaError)
}

/// Captura parcial: cada entrada es independiente, pero todas viajan en una transacción.
export async function recordOccurrencesBulk(entries: BulkRecordEntryDto[], userId: number | null) {
    try {
        const occurrences = await prisma.$transaction(
            entries.map((entry) =>
                prisma.meetingOccurrence.update({
                    where: { id: entry.occurrenceId },
                    data: recordData(entry, userId),
                    include: occurrenceInclude,
                }),
            ),
        )
        return occurrences.map(toOccurrenceRecord)
    } catch (error) {
        return mapPrismaError(error)
    }
}

/// Corrección de lo ya registrado; deja rastro de quién la hizo.
export function updateOccurrence(id: number, dto: UpdateOccurrenceDto, userId: number | null) {
    const data: Prisma.MeetingOccurrenceUpdateInput = {
        updatedBy: { connect: { id: userId ?? 0 } },
    }

    if (userId === null) delete data.updatedBy
    if (dto.attendance !== undefined) data.attendance = dto.attendance
    if (dto.currency !== undefined) data.currency = dto.currency
    if (dto.notes !== undefined) data.notes = dto.notes
    if (dto.details !== undefined) {
        data.totalAmount = resolveTotal(dto.details, dto.totalAmount ?? null)
        data.details = {
            deleteMany: {},
            create: dto.details.map((detail) => ({
                categoryId: detail.categoryId,
                amount: detail.amount,
                notes: detail.notes,
            })),
        }
    } else if (dto.totalAmount !== undefined && dto.totalAmount !== null) {
        data.totalAmount = round2(dto.totalAmount)
    }

    return prisma.meetingOccurrence
        .update({ where: { id }, data, include: occurrenceInclude })
        .then(toOccurrenceRecord)
        .catch(mapPrismaError)
}
