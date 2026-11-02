import type { Prisma } from '@prisma/client'
import { prisma } from '../database/prisma'
import type { OccurrenceScopeFilter } from '../dto/offering/occurrence.dto'
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

const personSelect = {
    username: true,
    email: true,
    member: { select: { firstName: true, lastName: true } },
} satisfies Prisma.UserSelect

export const meetingReportOccurrenceSelect = {
    id: true,
    meetingId: true,
    date: true,
    status: true,
    attendance: true,
    totalAmount: true,
    recordedAt: true,
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
    recordedBy: { select: personSelect },
    details: { select: { categoryId: true, amount: true } },
    offeringReception: {
        select: {
            status: true,
            receivedAmount: true,
            amountDifference: true,
            directEntry: true,
            closedAt: true,
            receivedAt: true,
        },
    },
} satisfies Prisma.MeetingOccurrenceSelect

export type MeetingReportOccurrence = Prisma.MeetingOccurrenceGetPayload<{
    select: typeof meetingReportOccurrenceSelect
}>

function dateOf(iso: string) {
    return new Date(`${iso}T00:00:00.000Z`)
}

export function findMeetingReportOccurrences(
    scope: OccurrenceScopeFilter,
    from: string,
    to: string,
) {
    return prisma.meetingOccurrence.findMany({
        where: {
            AND: [
                scopeWhere(scope),
                { date: { gte: dateOf(from), lte: dateOf(to) } },
                { OR: [{ status: 'RECORDED' }, { meeting: { isActive: true } }] },
            ],
        },
        select: meetingReportOccurrenceSelect,
        orderBy: [{ date: 'asc' }, { meetingId: 'asc' }],
    })
}

export function findReportCategories() {
    return prisma.offeringCategory.findMany({
        select: { id: true, code: true, name: true, isActive: true, sortOrder: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
}
