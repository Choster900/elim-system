import type { Prisma } from '@prisma/client'
import { prisma } from '../database/prisma'
import type { OccurrenceScopeFilter } from '../dto/offering/occurrence.dto'
import { businessDayStart, nextIsoDate } from '../utils/date/business-time.util'
import { scopeWhere } from './occurrence.repository'

const sectorPathSelect = {
    id: true,
    code: true,
    name: true,
    zone: {
        select: {
            id: true,
            code: true,
            name: true,
            district: { select: { id: true, code: true, name: true } },
        },
    },
} satisfies Prisma.TerritorySectorSelect

const receiverSelect = {
    username: true,
    email: true,
    member: { select: { firstName: true, lastName: true } },
} satisfies Prisma.UserSelect

export const meetingReportReceptionSelect = {
    id: true,
    occurrenceId: true,
    status: true,
    receivedAmount: true,
    directEntry: true,
    closedAt: true,
    receivedAt: true,
    receivedBy: { select: receiverSelect },
    details: { select: { categoryId: true, amount: true } },
    occurrence: {
        select: {
            meetingId: true,
            date: true,
            meeting: {
                select: {
                    code: true,
                    title: true,
                    color: true,
                    isActive: true,
                    startTime: true,
                    endTime: true,
                    type: { select: { id: true, name: true, isGeneral: true } },
                    sector: { select: sectorPathSelect },
                },
            },
            sector: { select: sectorPathSelect },
            leader: { select: { firstName: true, lastName: true } },
        },
    },
} satisfies Prisma.OfferingReceptionSelect

export type MeetingReportReception = Prisma.OfferingReceptionGetPayload<{
    select: typeof meetingReportReceptionSelect
}>

export const meetingReportTitheSelect = {
    id: true,
    amount: true,
    date: true,
    notes: true,
    receivedAt: true,
    receivedBy: { select: receiverSelect },
    member: {
        select: {
            id: true,
            code: true,
            firstName: true,
            middleName: true,
            lastName: true,
            secondLastName: true,
            territorySector: { select: sectorPathSelect },
        },
    },
} satisfies Prisma.TitheSelect

export type MeetingReportTithe = Prisma.TitheGetPayload<{
    select: typeof meetingReportTitheSelect
}>

function receivedBetween(from: string, to: string) {
    return { gte: businessDayStart(from), lt: businessDayStart(nextIsoDate(to)) }
}

export function findMeetingReportReceptions(
    scope: OccurrenceScopeFilter,
    from: string,
    to: string,
) {
    return prisma.offeringReception.findMany({
        where: {
            status: { not: 'CANCELLED' },
            receivedAt: receivedBetween(from, to),
            occurrence: scopeWhere(scope),
        },
        select: meetingReportReceptionSelect,
        orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }],
    })
}

export function findMeetingReportTithes(scope: OccurrenceScopeFilter, from: string, to: string) {
    return prisma.tithe.findMany({
        where: {
            receivedAt: receivedBetween(from, to),
            ...(scope.seesAll ? {} : { member: { territorySectorId: { in: scope.sectorIds } } }),
        },
        select: meetingReportTitheSelect,
        orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }],
    })
}

export function findReportCategories() {
    return prisma.offeringCategory.findMany({
        select: { id: true, code: true, name: true, isActive: true, sortOrder: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
}
