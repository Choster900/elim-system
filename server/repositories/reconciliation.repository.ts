import type { Prisma } from '@prisma/client'
import { prisma } from '../database/prisma'
import type { OccurrenceScopeFilter } from '../dto/offering/occurrence.dto'
import type { ReconciliationPeriodDto } from '../dto/offering/reconciliation.dto'
import { businessDayStart, nextIsoDate } from '../utils/date/business-time.util'
import { occurrenceInclude, scopeWhere, toOccurrenceRecord } from './occurrence.repository'
import { receptionCoreInclude, toReceptionCore } from './reception.repository'

const reconciliationInclude = {
    ...occurrenceInclude,
    offeringReception: { include: receptionCoreInclude },
} satisfies Prisma.MeetingOccurrenceInclude

export async function findReconciliationRows(
    scope: OccurrenceScopeFilter,
    period: ReconciliationPeriodDto,
) {
    const receivedInPeriod: Prisma.MeetingOccurrenceWhereInput = {
        offeringReception: {
            is: {
                receivedAt: {
                    gte: businessDayStart(period.from),
                    lt: businessDayStart(nextIsoDate(period.to)),
                },
            },
        },
    }
    const notDelivered: Prisma.MeetingOccurrenceWhereInput = { offeringReception: { is: null } }

    const occurrences = await prisma.meetingOccurrence.findMany({
        where: {
            AND: [
                scopeWhere(scope),
                { status: 'RECORDED' },
                period.sectorId ? { sectorId: period.sectorId } : {},
                { OR: [receivedInPeriod, notDelivered] },
            ],
        },
        include: reconciliationInclude,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
    })

    return occurrences.map((occurrence) => ({
        occurrence: toOccurrenceRecord(occurrence),
        reception: occurrence.offeringReception
            ? toReceptionCore(occurrence.offeringReception)
            : null,
    }))
}

export type ReconciliationRow = Awaited<ReturnType<typeof findReconciliationRows>>[number]
