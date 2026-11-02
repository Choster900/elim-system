import type { OccurrenceScopeFilter } from '../dto/offering/occurrence.dto'
import type {
    MeetingReportDto,
    MeetingReportQueryDto,
    MeetingReportRowDto,
} from '../dto/report/meeting-report.dto'
import { personName } from '../repositories/occurrence.repository'
import { statusFromDb as receptionStatusFromDb } from '../repositories/reception.repository'
import {
    findMeetingReportOccurrences,
    findReportCategories,
    type MeetingReportOccurrence,
} from '../repositories/report.repository'
import { meetingFullCode } from '../utils/code/entity-code.util'

const REPORT_CURRENCY = 'USD'

function toCents(value: unknown) {
    return Math.round(Number(value ?? 0) * 100)
}

function fromCents(cents: number) {
    return cents / 100
}

function fullName(person: { firstName: string; lastName: string } | null) {
    if (!person) return null
    return [person.firstName, person.lastName].filter(Boolean).join(' ') || null
}

function toReportRow(occurrence: MeetingReportOccurrence): MeetingReportRowDto {
    const { meeting, sector, offeringReception: reception } = occurrence
    const isRecorded = occurrence.status === 'RECORDED'
    const totalCents = occurrence.totalAmount === null ? null : toCents(occurrence.totalAmount)
    const detailCents = occurrence.details.reduce((sum, detail) => sum + toCents(detail.amount), 0)

    return {
        id: occurrence.id,
        meetingId: occurrence.meetingId,
        meetingCode: meetingFullCode(meeting.code, meeting.sector),
        meetingTitle: meeting.title,
        meetingColor: meeting.color,
        meetingTypeId: meeting.type.id,
        meetingTypeName: meeting.type.name,
        isGeneral: meeting.type.isGeneral,
        isMeetingActive: meeting.isActive,
        date: occurrence.date.toISOString().slice(0, 10),
        startTime: meeting.startTime.toISOString().slice(11, 16),
        endTime: meeting.endTime.toISOString().slice(11, 16),
        status: isRecorded ? 'registrada' : 'pendiente',
        districtId: sector?.zone.district.id ?? null,
        districtName: sector?.zone.district.name ?? null,
        zoneId: sector?.zone.id ?? null,
        zoneName: sector?.zone.name ?? null,
        sectorId: sector?.id ?? null,
        sectorName: sector?.name ?? null,
        leaderName: fullName(occurrence.leader),
        attendance: isRecorded ? occurrence.attendance : null,
        totalAmount: isRecorded ? fromCents(totalCents ?? detailCents) : null,
        uncategorizedAmount: isRecorded
            ? fromCents(Math.max(0, (totalCents ?? 0) - detailCents))
            : 0,
        offerings: occurrence.details
            .filter((detail) => toCents(detail.amount) !== 0)
            .map((detail) => ({
                categoryId: detail.categoryId,
                amount: fromCents(toCents(detail.amount)),
            })),
        reception: reception
            ? {
                  status: receptionStatusFromDb(reception.status),
                  receivedAmount: fromCents(toCents(reception.receivedAmount)),
                  difference: fromCents(toCents(reception.amountDifference)),
                  directEntry: reception.directEntry,
                  isClosed: reception.closedAt !== null,
                  receivedAt: reception.receivedAt.toISOString(),
              }
            : null,
        recordedByName: personName(occurrence.recordedBy),
        recordedAt: occurrence.recordedAt?.toISOString() ?? null,
    }
}

export async function getMeetingReport(
    scope: OccurrenceScopeFilter,
    query: MeetingReportQueryDto,
): Promise<MeetingReportDto> {
    const [occurrences, categories] = await Promise.all([
        findMeetingReportOccurrences(scope, query.from, query.to),
        findReportCategories(),
    ])
    const rows = occurrences.map(toReportRow)
    const usedCategoryIds = new Set(
        rows.flatMap((row) => row.offerings.map((offering) => offering.categoryId)),
    )

    return {
        from: query.from,
        to: query.to,
        generatedAt: new Date().toISOString(),
        currency: REPORT_CURRENCY,
        categories: categories.filter(
            (category) => category.isActive || usedCategoryIds.has(category.id),
        ),
        rows,
    }
}
