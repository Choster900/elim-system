import type { Prisma } from '@prisma/client'
import { prisma } from '../database/prisma'

export interface DashboardRepositoryFilters {
    rangeStart: Date
    currentStart: Date
    endExclusive: Date
    sectorIds?: number[]
    districtId?: number
}

export function findDashboardData(filters: DashboardRepositoryFilters) {
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

    return prisma.$transaction(async (transaction) => {
        const [offerings, meetings, activeMembers, newMembers, previousNewMembers, districts] =
            await Promise.all([
                transaction.meetingOffering.findMany({
                    where: {
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
                transaction.meeting.findMany({
                    where: {
                        ...meetingWhere,
                        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                    },
                    include: {
                        type: true,
                        sector: { include: { zone: { include: { district: true } } } },
                    },
                }),
                transaction.member.count({ where: memberWhere }),
                transaction.member.count({
                    where: {
                        ...memberWhere,
                        joinedAt: { gte: filters.currentStart, lt: filters.endExclusive },
                    },
                }),
                transaction.member.count({
                    where: {
                        ...memberWhere,
                        joinedAt: { gte: filters.rangeStart, lt: filters.currentStart },
                    },
                }),
                transaction.district.findMany({
                    where: districtWhere,
                    select: { id: true, name: true },
                    orderBy: { name: 'asc' },
                }),
            ])

        return {
            offerings,
            meetings,
            activeMembers,
            newMembers,
            previousNewMembers,
            districts,
        }
    })
}
