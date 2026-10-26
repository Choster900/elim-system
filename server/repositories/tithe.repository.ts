import type { Prisma } from '@prisma/client'
import { TITHER_ROLE_CODE } from '../constants/member.constants'
import { prisma } from '../database/prisma'
import type { SaveTitheDto, TitheFiltersDto } from '../dto/tithe/tithe.dto'
import { mapPrismaError } from '../utils/database/prisma-error.util'
import { businessIsoDate } from '../utils/date/business-time.util'
import { personName } from './occurrence.repository'

const titheMemberInclude = {
    territorySector: { include: { zone: true } },
} satisfies Prisma.MemberInclude

const titheInclude = {
    member: { include: titheMemberInclude },
    receivedBy: { include: { member: true } },
    updatedBy: { include: { member: true } },
} satisfies Prisma.TitheInclude

type MemberWithSector = Prisma.MemberGetPayload<{ include: typeof titheMemberInclude }>

type TitheWithRelations = Prisma.TitheGetPayload<{ include: typeof titheInclude }>

function dateOf(iso: string) {
    return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`)
}

function toIsoDate(value: Date) {
    return value.toISOString().slice(0, 10)
}

function fullName(member: {
    firstName: string
    middleName: string | null
    lastName: string
    secondLastName: string | null
}) {
    return [member.firstName, member.middleName, member.lastName, member.secondLastName]
        .filter(Boolean)
        .join(' ')
}

function toTitheMember(member: MemberWithSector) {
    return {
        id: member.id,
        code: member.code,
        fullName: fullName(member),
        documentNumber: member.documentNumber,
        status: member.status,
        sectorName: member.territorySector?.name ?? null,
        zoneName: member.territorySector?.zone.name ?? null,
    }
}

export type TitheMember = ReturnType<typeof toTitheMember>

function toTitheRecord(tithe: TitheWithRelations) {
    return {
        id: tithe.id,
        member: toTitheMember(tithe.member),
        amount: Number(tithe.amount),
        date: toIsoDate(tithe.date),
        notes: tithe.notes,
        receivedById: tithe.receivedById,
        receivedByName: personName(tithe.receivedBy),
        receivedAt: tithe.receivedAt,
        updatedByName: personName(tithe.updatedBy),
        updatedAt: tithe.updatedAt,
    }
}

export type TitheRecord = ReturnType<typeof toTitheRecord>

function activeTitherRoleWhere(): Prisma.MemberCommunityRoleWhereInput {
    const today = dateOf(businessIsoDate())
    return {
        role: { code: TITHER_ROLE_CODE, isActive: true },
        AND: [
            { OR: [{ startedAt: null }, { startedAt: { lte: today } }] },
            { OR: [{ endedAt: null }, { endedAt: { gte: today } }] },
        ],
    }
}

export async function findTithers() {
    const members = await prisma.member.findMany({
        where: {
            status: { not: 'DECEASED' },
            communityRoles: { some: activeTitherRoleWhere() },
        },
        include: titheMemberInclude,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { id: 'asc' }],
    })
    return members.map(toTitheMember)
}

export async function findMemberForTithe(memberId: number) {
    const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: {
            id: true,
            status: true,
            communityRoles: { where: activeTitherRoleWhere(), select: { id: true }, take: 1 },
        },
    })
    if (!member) return null
    return { id: member.id, status: member.status, isTither: member.communityRoles.length > 0 }
}

export async function summarizeTithes(filters: {
    from: string
    to: string
    zoneId?: number
    sectorIds?: number[]
}) {
    const memberFilters: Prisma.MemberWhereInput[] = []
    if (filters.zoneId) memberFilters.push({ territorySector: { zoneId: filters.zoneId } })
    if (filters.sectorIds) memberFilters.push({ territorySectorId: { in: filters.sectorIds } })

    const tithes = await prisma.tithe.findMany({
        where: {
            date: { gte: dateOf(filters.from), lte: dateOf(filters.to) },
            ...(memberFilters.length > 0 ? { member: { AND: memberFilters } } : {}),
        },
        select: { amount: true, memberId: true },
    })
    const cents = tithes.reduce((sum, tithe) => sum + Math.round(Number(tithe.amount) * 100), 0)
    return {
        count: tithes.length,
        members: new Set(tithes.map((tithe) => tithe.memberId)).size,
        amount: cents / 100,
    }
}

export async function findTithes(filters: TitheFiltersDto) {
    const tithes = await prisma.tithe.findMany({
        where:
            filters.from || filters.to
                ? {
                      date: {
                          ...(filters.from ? { gte: dateOf(filters.from) } : {}),
                          ...(filters.to ? { lte: dateOf(filters.to) } : {}),
                      },
                  }
                : {},
        include: titheInclude,
        orderBy: [{ date: 'desc' }, { receivedAt: 'desc' }, { id: 'desc' }],
    })
    return tithes.map(toTitheRecord)
}

export async function findTitheById(id: number) {
    const tithe = await prisma.tithe.findUnique({ where: { id }, include: titheInclude })
    return tithe ? toTitheRecord(tithe) : null
}

export async function createTithe(dto: SaveTitheDto, userId: number) {
    const tithe = await prisma.tithe
        .create({
            data: {
                memberId: dto.memberId,
                amount: dto.amount,
                date: dateOf(dto.date),
                notes: dto.notes || null,
                receivedById: userId,
            },
            include: titheInclude,
        })
        .catch(mapPrismaError)
    return toTitheRecord(tithe)
}

export async function updateTithe(id: number, dto: SaveTitheDto, userId: number) {
    const tithe = await prisma.tithe
        .update({
            where: { id },
            data: {
                memberId: dto.memberId,
                amount: dto.amount,
                date: dateOf(dto.date),
                notes: dto.notes || null,
                updatedById: userId,
            },
            include: titheInclude,
        })
        .catch(mapPrismaError)
    return toTitheRecord(tithe)
}

export async function deleteTithe(id: number) {
    await prisma.tithe.delete({ where: { id } }).catch(mapPrismaError)
}
