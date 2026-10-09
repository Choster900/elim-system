import type { Prisma } from '@prisma/client'
import { prisma } from '../database/prisma'
import type { OccurrenceScopeFilter } from '../dto/offering/occurrence.dto'
import type {
    PendingEnvelopesFiltersDto,
    ReceptionCategoryWriteDto,
    ReceptionFiltersDto,
    ReceptionWriteDto,
} from '../dto/offering/reception.dto'
import { mapPrismaError } from '../utils/database/prisma-error.util'
import { businessDayStart, businessIsoDate, nextIsoDate } from '../utils/date/business-time.util'
import { toDenominationRecord } from './denomination.repository'
import {
    occurrenceInclude,
    personName,
    scopeWhere,
    toOccurrenceRecord,
} from './occurrence.repository'

export const receptionCoreInclude = {
    receivedBy: { include: { member: true } },
    reviewedBy: { include: { member: true } },
    closedBy: { include: { member: true } },
    details: {
        include: {
            category: true,
            counts: {
                include: { denomination: true },
                orderBy: { denomination: { sortOrder: 'asc' } },
            },
        },
        orderBy: { id: 'asc' },
    },
} satisfies Prisma.OfferingReceptionInclude

const receptionInclude = {
    ...receptionCoreInclude,
    occurrence: { include: occurrenceInclude },
} satisfies Prisma.OfferingReceptionInclude

type ReceptionCoreWithRelations = Prisma.OfferingReceptionGetPayload<{
    include: typeof receptionCoreInclude
}>

type ReceptionWithRelations = Prisma.OfferingReceptionGetPayload<{
    include: typeof receptionInclude
}>

function round2(value: number) {
    return Math.round(value * 100) / 100
}

function statusFromDb(status: string) {
    return status === 'VERIFIED' ? ('cuadra' as const) : ('con_diferencia' as const)
}

function statusToDb(status: ReceptionWriteDto['status']) {
    return status === 'cuadra' ? ('VERIFIED' as const) : ('DISCREPANCY' as const)
}

export function toReceptionCore(reception: ReceptionCoreWithRelations) {
    return {
        id: reception.id,
        occurrenceId: reception.occurrenceId,
        status: statusFromDb(reception.status),
        registeredAmount: Number(reception.systemAmount),
        countedAmount: Number(reception.receivedAmount),
        difference: Number(reception.amountDifference),
        currency: reception.currency,
        notes: reception.notes,
        receivedById: reception.receivedById,
        receivedByName: personName(reception.receivedBy),
        receivedAt: reception.receivedAt,
        reviewedById: reception.reviewedById,
        reviewedByName: personName(reception.reviewedBy),
        reviewedAt: reception.reviewedAt,
        closedById: reception.closedById,
        closedByName: personName(reception.closedBy),
        closedAt: reception.closedAt,
        closingNotes: reception.closingNotes,
        directEntry: reception.directEntry,
        categories: reception.details
            .map((detail) => ({
                categoryId: detail.categoryId,
                categoryName: detail.category?.name ?? null,
                sortOrder: detail.category?.sortOrder ?? 0,
                registeredAmount: Number(detail.systemAmount),
                countedAmount: Number(detail.amount),
                difference: round2(Number(detail.amount) - Number(detail.systemAmount)),
                counts: detail.counts.map((count) => ({
                    denomination: toDenominationRecord(count.denomination),
                    quantity: count.quantity,
                    amount: Number(count.amount),
                })),
            }))
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map(({ sortOrder: _sortOrder, ...category }) => category),
    }
}

export type ReceptionCore = ReturnType<typeof toReceptionCore>

export function toReceptionRecord(reception: ReceptionWithRelations) {
    return { ...toReceptionCore(reception), occurrence: toOccurrenceRecord(reception.occurrence) }
}

export type ReceptionRecord = ReturnType<typeof toReceptionRecord>

function receptionFiltersWhere(filters: ReceptionFiltersDto): Prisma.OfferingReceptionWhereInput {
    return {
        ...(filters.status ? { status: statusToDb(filters.status) } : {}),
        ...(filters.from || filters.to
            ? {
                  receivedAt: {
                      ...(filters.from ? { gte: businessDayStart(filters.from) } : {}),
                      ...(filters.to
                          ? { lt: businessDayStart(nextIsoDate(filters.to.slice(0, 10))) }
                          : {}),
                  },
              }
            : {}),
    }
}

function detailsCreate(categories: ReceptionCategoryWriteDto[]) {
    return categories.map((category) => ({
        categoryId: category.categoryId,
        systemAmount: category.systemAmount,
        amount: category.amount,
        counts: {
            create: category.counts.map((count) => ({
                denominationId: count.denominationId,
                quantity: count.quantity,
                amount: count.amount,
            })),
        },
    }))
}

const ACCENTED = 'áàäâéèëêíìïîóòöôúùüûñ'
const PLAIN = 'aaaaeeeeiiiioooouuuun'

function normalizeSearch(text: string) {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[\\%_]/g, (character) => `\\${character}`)
}

async function findPendingIdsMatching(search: string) {
    const pattern = `%${normalizeSearch(search)}%`
    const rows = await prisma.$queryRaw<{ id: number }[]>`
        SELECT  reo."reo_id" AS id
        FROM    "reo_reunion_ocurrencia" AS reo
                INNER JOIN "reu_reunion" AS reu ON reu."reu_id" = reo."reo_id_reu"
                LEFT JOIN "mie_miembro" AS mie ON mie."mie_id" = reo."reo_id_mie_lider"
                LEFT JOIN "sec_sector" AS sec ON sec."sec_id" = reo."reo_id_sec"
                LEFT JOIN "zon_zona" AS zon ON zon."zon_id" = sec."sec_id_zon"
                LEFT JOIN "dis_distrito" AS dis ON dis."dis_id" = zon."zon_id_dis"
                INNER JOIN "tir_tipo_reunion" AS tir ON tir."tir_id" = reu."reu_id_tir"
                LEFT JOIN "rof_recepcion_ofrenda" AS rof ON rof."rof_id_reo" = reo."reo_id"
        WHERE   (
                    reo."reo_estado" = 'registrada'
                    OR (reo."reo_estado" = 'pendiente' AND tir."tir_general" = TRUE)
                )
                AND rof."rof_id" IS NULL
                AND translate(
                        lower(concat_ws(' ',
                            reu."reu_titulo",
                            concat(dis."dis_codigo", zon."zon_codigo", sec."sec_codigo", reu."reu_codigo"),
                            mie."mie_primer_nombre",
                            mie."mie_primer_apellido",
                            sec."sec_nombre",
                            zon."zon_nombre"
                        )),
                        ${ACCENTED},
                        ${PLAIN}
                    ) LIKE ${pattern}
    `
    return rows.map((row) => row.id)
}

async function pendingWhere(
    scope: OccurrenceScopeFilter,
    filters: PendingEnvelopesFiltersDto = {},
): Promise<Prisma.MeetingOccurrenceWhereInput> {
    const search = filters.search?.trim()
    const matchingIds = search ? await findPendingIdsMatching(search) : null
    const today = new Date(`${businessIsoDate()}T00:00:00.000Z`)
    return {
        AND: [
            scopeWhere(scope),
            {
                OR: [
                    { status: 'RECORDED' },
                    {
                        status: 'PENDING',
                        meeting: { type: { isGeneral: true } },
                        date: { lte: today },
                    },
                ],
            },
            { offeringReception: { is: null } },
            filters.zoneId ? { sector: { zoneId: filters.zoneId } } : {},
            matchingIds ? { id: { in: matchingIds } } : {},
        ],
    }
}

export async function findPendingEnvelopeOccurrences(
    scope: OccurrenceScopeFilter,
    filters: PendingEnvelopesFiltersDto,
    page: { skip: number; take: number },
) {
    const where = await pendingWhere(scope, filters)
    const [occurrences, totalItems] = await prisma.$transaction([
        prisma.meetingOccurrence.findMany({
            where,
            include: occurrenceInclude,
            orderBy: [{ date: 'asc' }, { id: 'asc' }],
            skip: page.skip,
            take: page.take,
        }),
        prisma.meetingOccurrence.count({ where }),
    ])
    return { items: occurrences.map(toOccurrenceRecord), totalItems }
}

export async function findPendingEnvelopeZones(scope: OccurrenceScopeFilter) {
    const sectors = await prisma.meetingOccurrence.findMany({
        where: await pendingWhere(scope),
        distinct: ['sectorId'],
        select: { sector: { select: { zone: { select: { id: true, name: true } } } } },
    })
    const zones = new Map<number, string>()
    for (const row of sectors) {
        if (row.sector) zones.set(row.sector.zone.id, row.sector.zone.name)
    }
    return [...zones.entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((left, right) => left.name.localeCompare(right.name, 'es'))
}

export async function findReceptions(scope: OccurrenceScopeFilter, filters: ReceptionFiltersDto) {
    const receptions = await prisma.offeringReception.findMany({
        where: { AND: [{ occurrence: scopeWhere(scope) }, receptionFiltersWhere(filters)] },
        include: receptionInclude,
        orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
    })
    return receptions.map(toReceptionRecord)
}

export async function findReceptionByOccurrenceId(occurrenceId: number) {
    const reception = await prisma.offeringReception.findUnique({
        where: { occurrenceId },
        include: receptionInclude,
    })
    return reception ? toReceptionRecord(reception) : null
}

export function findReceptionIdByOccurrenceId(occurrenceId: number) {
    return prisma.offeringReception
        .findUnique({ where: { occurrenceId }, select: { id: true } })
        .then((reception) => reception?.id ?? null)
}

export function createReception(occurrenceId: number, dto: ReceptionWriteDto, userId: number) {
    return prisma.offeringReception
        .create({
            data: {
                occurrenceId,
                systemAmount: dto.systemAmount,
                receivedAmount: dto.receivedAmount,
                amountDifference: dto.amountDifference,
                status: statusToDb(dto.status),
                notes: dto.notes,
                receivedById: userId,
                receivedAt: new Date(),
                details: { create: detailsCreate(dto.categories) },
            },
            include: receptionInclude,
        })
        .then(toReceptionRecord)
        .catch(mapPrismaError)
}

function correctionData(dto: ReceptionWriteDto, userId: number) {
    return {
        systemAmount: dto.systemAmount,
        receivedAmount: dto.receivedAmount,
        amountDifference: dto.amountDifference,
        status: statusToDb(dto.status),
        notes: dto.notes,
        reviewedById: userId,
        reviewedAt: new Date(),
        details: { deleteMany: {}, create: detailsCreate(dto.categories) },
    }
}

export function updateReception(id: number, dto: ReceptionWriteDto, userId: number) {
    return prisma.offeringReception
        .update({ where: { id }, data: correctionData(dto, userId), include: receptionInclude })
        .then(toReceptionRecord)
        .catch(mapPrismaError)
}

function directOfferingDetails(dto: ReceptionWriteDto) {
    return dto.categories
        .filter((category) => category.categoryId !== null && category.amount > 0)
        .map((category) => ({ categoryId: category.categoryId!, amount: category.amount }))
}

export async function createDirectReception(
    occurrenceId: number,
    dto: ReceptionWriteDto,
    userId: number,
) {
    try {
        const reception = await prisma.$transaction(async (tx) => {
            await tx.meetingOccurrence.update({
                where: { id: occurrenceId },
                data: {
                    status: 'RECORDED',
                    attendance: null,
                    totalAmount: dto.receivedAmount,
                    currency: 'USD',
                    recordedById: userId,
                    recordedAt: new Date(),
                    details: { deleteMany: {}, create: directOfferingDetails(dto) },
                },
            })
            return tx.offeringReception.create({
                data: {
                    occurrenceId,
                    systemAmount: dto.systemAmount,
                    receivedAmount: dto.receivedAmount,
                    amountDifference: dto.amountDifference,
                    status: statusToDb(dto.status),
                    notes: dto.notes,
                    directEntry: true,
                    receivedById: userId,
                    receivedAt: new Date(),
                    details: { create: detailsCreate(dto.categories) },
                },
                include: receptionInclude,
            })
        })
        return toReceptionRecord(reception)
    } catch (error) {
        return mapPrismaError(error)
    }
}

export async function updateDirectReception(
    id: number,
    occurrenceId: number,
    dto: ReceptionWriteDto,
    userId: number,
) {
    try {
        const reception = await prisma.$transaction(async (tx) => {
            await tx.meetingOccurrence.update({
                where: { id: occurrenceId },
                data: {
                    totalAmount: dto.receivedAmount,
                    updatedById: userId,
                    details: { deleteMany: {}, create: directOfferingDetails(dto) },
                },
            })
            return tx.offeringReception.update({
                where: { id },
                data: correctionData(dto, userId),
                include: receptionInclude,
            })
        })
        return toReceptionRecord(reception)
    } catch (error) {
        return mapPrismaError(error)
    }
}

export function closeReception(id: number, notes: string, userId: number) {
    return prisma.offeringReception
        .update({
            where: { id },
            data: { closedById: userId, closedAt: new Date(), closingNotes: notes },
            include: receptionInclude,
        })
        .then(toReceptionRecord)
        .catch(mapPrismaError)
}
