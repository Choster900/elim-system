import type { OccurrenceScopeFilter } from '../dto/offering/occurrence.dto'
import type {
    MeetingReportDto,
    MeetingReportQueryDto,
    MeetingReportRowDto,
} from '../dto/report/meeting-report.dto'
import { personName } from '../repositories/occurrence.repository'
import { statusFromDb as receptionStatusFromDb } from '../repositories/reception.repository'
import {
    findMeetingReportReceptions,
    findMeetingReportTithes,
    findReportCategories,
    type MeetingReportReception,
    type MeetingReportTithe,
} from '../repositories/report.repository'
import { meetingFullCode } from '../utils/code/entity-code.util'
import { businessIsoDate } from '../utils/date/business-time.util'

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

function memberFullName(member: MeetingReportTithe['member']) {
    return [member.firstName, member.middleName, member.lastName, member.secondLastName]
        .filter(Boolean)
        .join(' ')
}

function categorizedOfferings(details: MeetingReportReception['details']) {
    const cents = new Map<number, number>()
    for (const detail of details) {
        if (detail.categoryId === null) continue
        cents.set(detail.categoryId, (cents.get(detail.categoryId) ?? 0) + toCents(detail.amount))
    }
    return [...cents]
        .filter(([, amount]) => amount !== 0)
        .map(([categoryId, amount]) => ({ categoryId, cents: amount }))
}

function toReportRow(reception: MeetingReportReception): MeetingReportRowDto {
    const { occurrence } = reception
    const { meeting, sector } = occurrence
    const receivedCents = toCents(reception.receivedAmount)
    const offerings = categorizedOfferings(reception.details)
    const categorizedCents = offerings.reduce((sum, offering) => sum + offering.cents, 0)

    return {
        key: `r-${reception.id}`,
        source: 'reunion',
        id: reception.id,
        occurrenceId: reception.occurrenceId,
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
        districtId: sector?.zone.district.id ?? null,
        districtName: sector?.zone.district.name ?? null,
        zoneId: sector?.zone.id ?? null,
        zoneName: sector?.zone.name ?? null,
        sectorId: sector?.id ?? null,
        sectorName: sector?.name ?? null,
        leaderName: fullName(occurrence.leader),
        titherId: null,
        titherCode: null,
        titherName: null,
        notes: null,
        receivedAmount: fromCents(receivedCents),
        uncategorizedAmount: fromCents(Math.max(0, receivedCents - categorizedCents)),
        offerings: offerings.map((offering) => ({
            categoryId: offering.categoryId,
            amount: fromCents(offering.cents),
        })),
        status: receptionStatusFromDb(reception.status),
        isClosed: reception.closedAt !== null,
        directEntry: reception.directEntry,
        receivedByName: personName(reception.receivedBy),
        receivedAt: reception.receivedAt.toISOString(),
        receivedDate: businessIsoDate(reception.receivedAt),
    }
}

function toTitheRow(tithe: MeetingReportTithe): MeetingReportRowDto {
    const { member } = tithe
    const sector = member.territorySector

    return {
        key: `d-${tithe.id}`,
        source: 'diezmo',
        id: tithe.id,
        occurrenceId: null,
        meetingId: null,
        meetingCode: null,
        meetingTitle: null,
        meetingColor: null,
        meetingTypeId: null,
        meetingTypeName: null,
        isGeneral: false,
        isMeetingActive: true,
        date: tithe.date.toISOString().slice(0, 10),
        startTime: null,
        endTime: null,
        districtId: sector?.zone.district.id ?? null,
        districtName: sector?.zone.district.name ?? null,
        zoneId: sector?.zone.id ?? null,
        zoneName: sector?.zone.name ?? null,
        sectorId: sector?.id ?? null,
        sectorName: sector?.name ?? null,
        leaderName: null,
        titherId: member.id,
        titherCode: member.code,
        titherName: memberFullName(member),
        notes: tithe.notes,
        receivedAmount: fromCents(toCents(tithe.amount)),
        uncategorizedAmount: 0,
        offerings: [],
        status: null,
        isClosed: false,
        directEntry: false,
        receivedByName: personName(tithe.receivedBy),
        receivedAt: tithe.receivedAt.toISOString(),
        receivedDate: businessIsoDate(tithe.receivedAt),
    }
}

export async function getMeetingReport(
    scope: OccurrenceScopeFilter,
    query: MeetingReportQueryDto,
): Promise<MeetingReportDto> {
    const [receptions, tithes, categories] = await Promise.all([
        findMeetingReportReceptions(scope, query.from, query.to),
        findMeetingReportTithes(scope, query.from, query.to),
        findReportCategories(),
    ])
    const rows = [...receptions.map(toReportRow), ...tithes.map(toTitheRow)]
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
