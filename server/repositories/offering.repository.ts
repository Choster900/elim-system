import type { Prisma } from '@prisma/client'
import { prisma } from '../database/prisma'
import type {
    CreateOfferingCategoryDto,
    CreateOfferingDto,
    OfferingDetailDto,
    UpdateOfferingCategoryDto,
    UpdateOfferingDto,
} from '../dto/offering/offering.dto'
import { mapPrismaError } from '../utils/database/prisma-error.util'

const offeringInclude = {
    meeting: true,
    recordedBy: { include: { member: true } },
    details: { include: { category: true }, orderBy: { category: { sortOrder: 'asc' } } },
} satisfies Prisma.MeetingOfferingInclude

type OfferingWithRelations = Prisma.MeetingOfferingGetPayload<{ include: typeof offeringInclude }>

function dateOf(iso: string) {
    return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`)
}

function toIsoDate(value: Date) {
    return value.toISOString().slice(0, 10)
}

function round2(value: number) {
    return Math.round(value * 100) / 100
}

function computeTotal(details: OfferingDetailDto[]) {
    return round2(details.reduce((sum, detail) => sum + detail.amount, 0))
}

function recorderName(offering: OfferingWithRelations) {
    const user = offering.recordedBy
    if (!user) return null
    if (user.member) {
        return [user.member.firstName, user.member.lastName].filter(Boolean).join(' ')
    }
    return user.username ?? user.email
}

export function toOfferingRecord(offering: OfferingWithRelations) {
    return {
        id: offering.id,
        meetingId: offering.meetingId,
        meetingTitle: offering.meeting?.title ?? null,
        date: toIsoDate(offering.date),
        attendance: offering.attendance,
        totalAmount: Number(offering.totalAmount),
        currency: offering.currency,
        notes: offering.notes,
        recordedById: offering.recordedById,
        recordedByName: recorderName(offering),
        details: offering.details.map((detail) => ({
            id: detail.id,
            categoryId: detail.categoryId,
            categoryName: detail.category?.name ?? null,
            amount: Number(detail.amount),
            notes: detail.notes,
        })),
        createdAt: offering.createdAt,
        updatedAt: offering.updatedAt,
    }
}

export async function findOfferings(filters: { meetingId?: number; sectorIds?: number[] } = {}) {
    const offerings = await prisma.meetingOffering.findMany({
        where: {
            ...(filters.meetingId ? { meetingId: filters.meetingId } : {}),
            ...(filters.sectorIds ? { meeting: { sectorId: { in: filters.sectorIds } } } : {}),
        },
        include: offeringInclude,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
    })
    return offerings.map(toOfferingRecord)
}

export async function findOfferingById(id: number) {
    const offering = await prisma.meetingOffering.findUnique({
        where: { id },
        include: offeringInclude,
    })
    return offering ? toOfferingRecord(offering) : null
}

export async function createOffering(dto: CreateOfferingDto, recordedById: number | null) {
    return prisma.meetingOffering
        .create({
            data: {
                meeting: { connect: { id: dto.meetingId } },
                date: dateOf(dto.date),
                attendance: dto.attendance,
                totalAmount: computeTotal(dto.details),
                currency: dto.currency,
                notes: dto.notes,
                ...(recordedById ? { recordedBy: { connect: { id: recordedById } } } : {}),
                details: {
                    create: dto.details.map((detail) => ({
                        categoryId: detail.categoryId,
                        amount: detail.amount,
                        notes: detail.notes,
                    })),
                },
            },
            include: offeringInclude,
        })
        .then(toOfferingRecord)
        .catch(mapPrismaError)
}

export async function updateOffering(id: number, dto: UpdateOfferingDto) {
    const data: Prisma.MeetingOfferingUpdateInput = {}
    if (dto.meetingId !== undefined) data.meeting = { connect: { id: dto.meetingId } }
    if (dto.date !== undefined) data.date = dateOf(dto.date)
    if (dto.attendance !== undefined) data.attendance = dto.attendance
    if (dto.currency !== undefined) data.currency = dto.currency
    if (dto.notes !== undefined) data.notes = dto.notes
    if (dto.details !== undefined) {
        data.totalAmount = computeTotal(dto.details)
        data.details = {
            deleteMany: {},
            create: dto.details.map((detail) => ({
                categoryId: detail.categoryId,
                amount: detail.amount,
                notes: detail.notes,
            })),
        }
    }

    return prisma.meetingOffering
        .update({ where: { id }, data, include: offeringInclude })
        .then(toOfferingRecord)
        .catch(mapPrismaError)
}

export function deleteOffering(id: number) {
    return prisma.meetingOffering.delete({ where: { id } }).catch(mapPrismaError)
}

// --- Offering categories ---

export function findOfferingCategories() {
    return prisma.offeringCategory.findMany({
        orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    })
}

export function findOfferingCategoryById(id: number) {
    return prisma.offeringCategory.findUnique({ where: { id } })
}

export function findOfferingCategoryIdsByIds(ids: number[]) {
    return prisma.offeringCategory
        .findMany({ where: { id: { in: ids } }, select: { id: true } })
        .then((rows) => rows.map((row) => row.id))
}

export function createOfferingCategory(dto: CreateOfferingCategoryDto) {
    return prisma.offeringCategory.create({ data: dto }).catch(mapPrismaError)
}

export function updateOfferingCategory(id: number, dto: UpdateOfferingCategoryDto) {
    return prisma.offeringCategory.update({ where: { id }, data: dto }).catch(mapPrismaError)
}

export function deleteOfferingCategory(id: number) {
    return prisma.offeringCategory.delete({ where: { id } }).catch(mapPrismaError)
}
