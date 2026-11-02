import type { Prisma } from '@prisma/client'
import { prisma } from '../database/prisma'
import type { DashboardKind } from '../dto/dashboard/dashboard.dto'

export interface DashboardRepositoryFilters {
    rangeStart: Date
    currentStart: Date
    endExclusive: Date
    kind: DashboardKind
    scope?: { sectorIds: number[]; meetingIds: number[] }
    districtId?: number
}

export async function findDashboardData(filters: DashboardRepositoryFilters) {
    const scope = filters.scope
    const isGeneral = filters.kind === 'generales'
    const meetingWhere: Prisma.MeetingWhereInput = {
        type: { isGeneral },
        ...(scope && !isGeneral
            ? { OR: [{ sectorId: { in: scope.sectorIds } }, { id: { in: scope.meetingIds } }] }
            : {}),
        ...(filters.districtId && !isGeneral
            ? { sector: { zone: { districtId: filters.districtId } } }
            : {}),
    }
    const memberWhere: Prisma.MemberWhereInput = {
        status: 'ACTIVE',
    }
    const districtWhere: Prisma.DistrictWhereInput = {
        isActive: true,
        ...(scope
            ? {
                  zones: {
                      some: {
                          sectors: {
                              some: {
                                  OR: [
                                      { id: { in: scope.sectorIds } },
                                      { meetings: { some: { id: { in: scope.meetingIds } } } },
                                  ],
                              },
                          },
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
        resultTypes,
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
                attendanceDetails: { include: { type: { include: { group: true } } } },
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
                AND: [
                    meetingWhere,
                    {
                        isActive: true,
                        OR: [{ sectorId: { not: null } }, { type: { isGeneral: true } }],
                    },
                ],
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
        prisma.attendanceType.findMany({
            where: {
                isActive: true,
                group: { isActive: true, countsTowardAttendance: false },
            },
            select: { id: true, code: true, name: true },
            orderBy: [{ group: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
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
        resultTypes,
    }
}
