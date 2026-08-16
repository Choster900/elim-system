import type { Prisma } from '@prisma/client'
import { prisma } from '../database/prisma'
import type {
    CreateMeetingDto,
    CreateMeetingTypeDto,
    MeetingFrequencyValue,
    MeetingStatusValue,
    UpdateMeetingDto,
    UpdateMeetingTypeDto,
} from '../dto/meeting/meeting.dto'
import { mapPrismaError } from '../utils/database/prisma-error.util'

const FREQUENCY_TO_DB = {
    unica: 'ONCE',
    semanal: 'WEEKLY',
    quincenal: 'BIWEEKLY',
    mensual: 'MONTHLY',
} as const

const FREQUENCY_FROM_DB: Record<string, MeetingFrequencyValue> = {
    ONCE: 'unica',
    WEEKLY: 'semanal',
    BIWEEKLY: 'quincenal',
    MONTHLY: 'mensual',
}

const STATUS_TO_DB = {
    programada: 'SCHEDULED',
    en_curso: 'IN_PROGRESS',
    completada: 'COMPLETED',
    cancelada: 'CANCELLED',
} as const

const STATUS_FROM_DB: Record<string, MeetingStatusValue> = {
    SCHEDULED: 'programada',
    IN_PROGRESS: 'en_curso',
    COMPLETED: 'completada',
    CANCELLED: 'cancelada',
}

const meetingInclude = {
    type: true,
    sector: true,
    supervisor: true,
    coSupervisors: true,
} satisfies Prisma.MeetingInclude

type MeetingWithRelations = Prisma.MeetingGetPayload<{ include: typeof meetingInclude }>

function dateOf(iso: string) {
    return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`)
}

function timeOf(hhmm: string) {
    const [hours, minutes] = hhmm.split(':').map(Number)
    return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0))
}

function toIsoDate(value: Date) {
    return value.toISOString().slice(0, 10)
}

function toHmm(value: Date) {
    return value.toISOString().slice(11, 16)
}

function fullName(member: { firstName: string; lastName: string } | null) {
    if (!member) return null
    return [member.firstName, member.lastName].filter(Boolean).join(' ')
}

export function toMeetingRecord(meeting: MeetingWithRelations) {
    return {
        id: meeting.id,
        typeId: meeting.typeId,
        sectorId: meeting.sectorId,
        supervisorId: meeting.supervisorId,
        coSupervisorIds: meeting.coSupervisors.map((item) => item.memberId),
        title: meeting.title,
        description: meeting.description,
        date: toIsoDate(meeting.date),
        startTime: toHmm(meeting.startTime),
        endTime: toHmm(meeting.endTime),
        location: meeting.location,
        latitude: meeting.latitude === null ? null : Number(meeting.latitude),
        longitude: meeting.longitude === null ? null : Number(meeting.longitude),
        frequency: FREQUENCY_FROM_DB[meeting.frequency] ?? 'unica',
        expectedAttendees: meeting.expectedAttendees,
        status: STATUS_FROM_DB[meeting.status] ?? 'programada',
        isPublic: meeting.isPublic,
        notes: meeting.notes,
        color: meeting.color,
        typeName: meeting.type?.name ?? null,
        typeColor: meeting.type?.color ?? null,
        sectorName: meeting.sector?.name ?? null,
        supervisorName: fullName(meeting.supervisor),
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt,
    }
}

function buildScalarData(dto: UpdateMeetingDto) {
    const data: Prisma.MeetingUpdateInput = {}
    if (dto.title !== undefined) data.title = dto.title
    if (dto.description !== undefined) data.description = dto.description
    if (dto.date !== undefined) data.date = dateOf(dto.date)
    if (dto.startTime !== undefined) data.startTime = timeOf(dto.startTime)
    if (dto.endTime !== undefined) data.endTime = timeOf(dto.endTime)
    if (dto.location !== undefined) data.location = dto.location
    if (dto.latitude !== undefined) data.latitude = dto.latitude
    if (dto.longitude !== undefined) data.longitude = dto.longitude
    if (dto.frequency !== undefined) data.frequency = FREQUENCY_TO_DB[dto.frequency]
    if (dto.expectedAttendees !== undefined) data.expectedAttendees = dto.expectedAttendees
    if (dto.status !== undefined) data.status = STATUS_TO_DB[dto.status]
    if (dto.isPublic !== undefined) data.isPublic = dto.isPublic
    if (dto.notes !== undefined) data.notes = dto.notes
    if (dto.color !== undefined) data.color = dto.color
    return data
}

export async function findMeetings(filters: { sectorIds?: number[] } = {}) {
    const meetings = await prisma.meeting.findMany({
        where: {
            ...(filters.sectorIds ? { sectorId: { in: filters.sectorIds } } : {}),
        },
        include: meetingInclude,
        orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    })
    return meetings.map(toMeetingRecord)
}

export async function findMeetingById(id: number) {
    const meeting = await prisma.meeting.findUnique({ where: { id }, include: meetingInclude })
    return meeting ? toMeetingRecord(meeting) : null
}

export async function createMeeting(dto: CreateMeetingDto) {
    return prisma.meeting
        .create({
            data: {
                type: { connect: { id: dto.typeId } },
                sector: { connect: { id: dto.sectorId } },
                supervisor: { connect: { id: dto.supervisorId } },
                title: dto.title,
                description: dto.description,
                date: dateOf(dto.date),
                startTime: timeOf(dto.startTime),
                endTime: timeOf(dto.endTime),
                location: dto.location,
                latitude: dto.latitude,
                longitude: dto.longitude,
                frequency: FREQUENCY_TO_DB[dto.frequency],
                expectedAttendees: dto.expectedAttendees,
                status: STATUS_TO_DB[dto.status],
                isPublic: dto.isPublic,
                notes: dto.notes,
                color: dto.color,
                ...(dto.coSupervisorIds.length
                    ? {
                          coSupervisors: {
                              create: dto.coSupervisorIds.map((memberId) => ({ memberId })),
                          },
                      }
                    : {}),
            },
            include: meetingInclude,
        })
        .then(toMeetingRecord)
        .catch(mapPrismaError)
}

export async function updateMeeting(id: number, dto: UpdateMeetingDto) {
    const data = buildScalarData(dto)
    if (dto.typeId !== undefined) data.type = { connect: { id: dto.typeId } }
    if (dto.sectorId !== undefined) data.sector = { connect: { id: dto.sectorId } }
    if (dto.supervisorId !== undefined) data.supervisor = { connect: { id: dto.supervisorId } }
    if (dto.coSupervisorIds !== undefined) {
        data.coSupervisors = {
            deleteMany: {},
            create: dto.coSupervisorIds.map((memberId) => ({ memberId })),
        }
    }

    return prisma.meeting
        .update({ where: { id }, data, include: meetingInclude })
        .then(toMeetingRecord)
        .catch(mapPrismaError)
}

export function deleteMeeting(id: number) {
    return prisma.meeting.delete({ where: { id } }).catch(mapPrismaError)
}

// --- Meeting types ---

export function findMeetingTypes() {
    return prisma.meetingType.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] })
}

export function findMeetingTypeById(id: number) {
    return prisma.meetingType.findUnique({ where: { id } })
}

export function createMeetingType(dto: CreateMeetingTypeDto) {
    return prisma.meetingType.create({ data: dto }).catch(mapPrismaError)
}

export function updateMeetingType(id: number, dto: UpdateMeetingTypeDto) {
    return prisma.meetingType.update({ where: { id }, data: dto }).catch(mapPrismaError)
}

export function deleteMeetingType(id: number) {
    return prisma.meetingType.delete({ where: { id } }).catch(mapPrismaError)
}
