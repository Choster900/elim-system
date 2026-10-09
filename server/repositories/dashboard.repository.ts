import type { Prisma } from '@prisma/client'
import { prisma } from '../database/prisma'

export interface DashboardRepositoryFilters {
    rangeStart: Date
    currentStart: Date
    endExclusive: Date
    sectorIds?: number[]
    districtId?: number
}

export async function findDashboardData(filters: DashboardRepositoryFilters) {
    const meetingWhere: Prisma.MeetingWhereInput = {
        ...(filters.sectorIds ? { sectorId: { in: filters.sectorIds } } : {}),
        ...(filters.districtId ? { sector: { zone: { districtId: filters.districtId } } } : {}),
    }
    const memberWhere: Prisma.MemberWhereInput = {
        status: 'ACTIVE',
    }
    const districtWhere: Prisma.DistrictWhereInput = {
        isActive: true,
        ...(filters.sectorIds
            ? {
                  zones: {
                      some: {
                          sectors: { some: { id: { in: filters.sectorIds } } },
                      },
                  },
              }
            : {}),
    }

    const [
        offerings,
        expectedOccurrences,
        meetings,
        activeMembers,
        newMembers,
        previousNewMembers,
        districts,
    ] = await Promise.all([
        prisma.meetingOccurrence.findMany({
            where: {
                status: 'RECORDED',
                date: { gte: filters.rangeStart, lt: filters.endExclusive },
                meeting: meetingWhere,
            },
            include: {
                meeting: {
                    include: {
                        type: true,
                        sector: { include: { zone: { include: { district: true } } } },
                    },
                },
                details: { include: { category: true } },
            },
            orderBy: [{ date: 'desc' }, { id: 'desc' }],
        }),
        prisma.meetingOccurrence.count({
            where: {
                date: { gte: filters.rangeStart, lt: filters.endExclusive },
                meeting: meetingWhere,
            },
        }),
        prisma.meeting.findMany({
            where: {
                ...meetingWhere,
                isActive: true,
                OR: [{ sectorId: { not: null } }, { type: { isGeneral: true } }],
            },
            include: {
                type: true,
                sector: { include: { zone: { include: { district: true } } } },
            },
        }),
        prisma.member.count({ where: memberWhere }),
        prisma.member.count({
            where: {
                ...memberWhere,
                joinedAt: { gte: filters.currentStart, lt: filters.endExclusive },
            },
        }),
        prisma.member.count({
            where: {
                ...memberWhere,
                joinedAt: { gte: filters.rangeStart, lt: filters.currentStart },
            },
        }),
        prisma.district.findMany({
            where: districtWhere,
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
    ])

    return {
        offerings: offerings.map((occurrence) => ({
            ...occurrence,
            attendance: occurrence.attendance ?? 0,
            totalAmount: occurrence.totalAmount ?? 0,
        })),
        expectedOccurrences,
        meetings,
        activeMembers,
        newMembers,
        previousNewMembers,
        districts,
    }
}
