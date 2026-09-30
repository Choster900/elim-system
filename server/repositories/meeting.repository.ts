import type { Prisma } from '@prisma/client'
import { prisma } from '../database/prisma'
import type {
    CreateMeetingDto,
    CreateMeetingTypeDto,
    MeetingFrequencyValue,
    MonthlyModeValue,
    UpdateMeetingDto,
    UpdateMeetingTypeDto,
} from '../dto/meeting/meeting.dto'
import { nextMeetingCode } from '../utils/code/entity-code.util'
import { mapPrismaError } from '../utils/database/prisma-error.util'

const FREQUENCY_TO_DB = {
    unica: 'ONCE',
    diaria: 'DAILY',
    semanal: 'WEEKLY',
    quincenal: 'BIWEEKLY',
    mensual: 'MONTHLY',
} as const

const FREQUENCY_FROM_DB: Record<string, MeetingFrequencyValue> = {
    ONCE: 'unica',
    DAILY: 'diaria',
    WEEKLY: 'semanal',
    BIWEEKLY: 'quincenal',
    MONTHLY: 'mensual',
}

const MONTHLY_MODE_TO_DB = {
    dia_fijo: 'FIXED_DAY',
    ordinal: 'ORDINAL',
} as const

const MONTHLY_MODE_FROM_DB: Record<string, MonthlyModeValue> = {
    FIXED_DAY: 'dia_fijo',
    ORDINAL: 'ordinal',
}

const meetingInclude = {
    type: true,
    sector: {
        include: {
            zone: {
                include: { district: true },
            },
        },
    },
    leader: true,
    supervisor: true,
    host: true,
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
        leaderId: meeting.leaderId,
        supervisorId: meeting.supervisorId,
        hostId: meeting.hostId,
        coSupervisorIds: meeting.coSupervisors.map((item) => item.memberId),
        title: meeting.title,
        description: meeting.description,
        code: meeting.code,
        date: toIsoDate(meeting.date),
        recurrenceEndDate:
            meeting.recurrenceEndDate === null ? null : toIsoDate(meeting.recurrenceEndDate),
        startTime: toHmm(meeting.startTime),
        endTime: toHmm(meeting.endTime),
        location: meeting.location,
        latitude: meeting.latitude === null ? null : Number(meeting.latitude),
        longitude: meeting.longitude === null ? null : Number(meeting.longitude),
        frequency: FREQUENCY_FROM_DB[meeting.frequency] ?? 'unica',
        monthlyMode: meeting.monthlyMode
            ? (MONTHLY_MODE_FROM_DB[meeting.monthlyMode] ?? null)
            : null,
        weekOrdinal: meeting.weekOrdinal,
        weekday: meeting.weekday,
        expectedAttendees: meeting.expectedAttendees,
        isActive: meeting.isActive,
        isPublic: meeting.isPublic,
        notes: meeting.notes,
        color: meeting.color,
        typeName: meeting.type?.name ?? null,
        typeColor: meeting.type?.color ?? null,
        sectorName: meeting.sector?.name ?? null,
        zoneId: meeting.sector.zone.id,
        zoneName: meeting.sector.zone.name,
        districtId: meeting.sector.zone.district.id,
        districtName: meeting.sector.zone.district.name,
        leaderName: fullName(meeting.leader),
        supervisorName: fullName(meeting.supervisor),
        hostName: fullName(meeting.host),
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt,
    }
}

function buildScalarData(dto: UpdateMeetingDto) {
    const data: Prisma.MeetingUpdateInput = {}
    if (dto.title !== undefined) data.title = dto.title
    if (dto.description !== undefined) data.description = dto.description
    if (dto.date !== undefined) data.date = dateOf(dto.date)
    if (dto.recurrenceEndDate !== undefined) {
        data.recurrenceEndDate = dto.recurrenceEndDate ? dateOf(dto.recurrenceEndDate) : null
    }
    if (dto.startTime !== undefined) data.startTime = timeOf(dto.startTime)
    if (dto.endTime !== undefined) data.endTime = timeOf(dto.endTime)
    if (dto.location !== undefined) data.location = dto.location
    if (dto.latitude !== undefined) data.latitude = dto.latitude
    if (dto.longitude !== undefined) data.longitude = dto.longitude
    if (dto.frequency !== undefined) data.frequency = FREQUENCY_TO_DB[dto.frequency]
    if (dto.monthlyMode !== undefined) {
        data.monthlyMode = dto.monthlyMode ? MONTHLY_MODE_TO_DB[dto.monthlyMode] : null
    }
    if (dto.weekOrdinal !== undefined) data.weekOrdinal = dto.weekOrdinal
    if (dto.weekday !== undefined) data.weekday = dto.weekday
    if (dto.expectedAttendees !== undefined) data.expectedAttendees = dto.expectedAttendees
    if (dto.isActive !== undefined) data.isActive = dto.isActive
    if (dto.isPublic !== undefined) data.isPublic = dto.isPublic
    if (dto.notes !== undefined) data.notes = dto.notes
    if (dto.color !== undefined) data.color = dto.color
    return data
}

export async function findMeetings(filters: { sectorIds?: number[]; meetingIds?: number[] } = {}) {
    // Sector y reunión se suman: un líder ve las suyas aunque no supervise el sector.
    const scopeClauses: Prisma.MeetingWhereInput[] = []
    if (filters.sectorIds) scopeClauses.push({ sectorId: { in: filters.sectorIds } })
    if (filters.meetingIds) scopeClauses.push({ id: { in: filters.meetingIds } })

    const meetings = await prisma.meeting.findMany({
        where: scopeClauses.length > 0 ? { OR: scopeClauses } : {},
        include: meetingInclude,
        orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    })
    return meetings.map(toMeetingRecord)
}

export async function findMeetingById(id: number) {
    const meeting = await prisma.meeting.findUnique({ where: { id }, include: meetingInclude })
    return meeting ? toMeetingRecord(meeting) : null
}

export async function findMeetingLeaders() {
    return findActiveCommunityRoleMembers('LEADER')
}

export async function findMeetingSupervisors() {
    return findActiveCommunityRoleMembers('SUPERVISOR')
}

export async function findMeetingHosts() {
    return findActiveCommunityRoleMembers('HOST')
}

async function findActiveCommunityRoleMembers(roleCode: string) {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const leaders = await prisma.member.findMany({
        where: {
            status: 'ACTIVE',
            communityRoles: {
                some: {
                    role: { code: roleCode, isActive: true },
                    AND: [
                        { OR: [{ startedAt: null }, { startedAt: { lte: today } }] },
                        { OR: [{ endedAt: null }, { endedAt: { gte: today } }] },
                    ],
                },
            },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    return leaders.map((leader) => ({
        id: leader.id,
        code: leader.code,
        fullName: [leader.firstName, leader.middleName, leader.lastName, leader.secondLastName]
            .filter(Boolean)
            .join(' '),
        documentNumber: leader.documentNumber,
        email: leader.email,
        phone: leader.phone,
        status: leader.status,
    }))
}

export async function isMeetingLeader(memberId: number) {
    return hasActiveCommunityRole(memberId, 'LEADER')
}

export async function isMeetingSupervisor(memberId: number) {
    return hasActiveCommunityRole(memberId, 'SUPERVISOR')
}

export async function isMeetingHost(memberId: number) {
    return hasActiveCommunityRole(memberId, 'HOST')
}

async function hasActiveCommunityRole(memberId: number, roleCode: string) {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const leader = await prisma.member.findFirst({
        where: {
            id: memberId,
            status: 'ACTIVE',
            communityRoles: {
                some: {
                    role: { code: roleCode, isActive: true },
                    AND: [
                        { OR: [{ startedAt: null }, { startedAt: { lte: today } }] },
                        { OR: [{ endedAt: null }, { endedAt: { gte: today } }] },
                    ],
                },
            },
        },
        select: { id: true },
    })

    return leader !== null
}

export async function createMeeting(dto: CreateMeetingDto) {
    // El consecutivo está delimitado por distrito, zona, sector y tipo. La transacción
    // serializable evita que dos altas simultáneas reciban el mismo código.
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const placeholder = `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        try {
            const meeting = await prisma.$transaction(
                async (transaction) => {
                    const existingCodes = await transaction.meeting.findMany({
                        where: { sectorId: dto.sectorId, typeId: dto.typeId },
                        select: { code: true },
                    })
                    const created = await transaction.meeting.create({
                        data: {
                            code: placeholder,
                            type: { connect: { id: dto.typeId } },
                            sector: { connect: { id: dto.sectorId } },
                            leader: { connect: { id: dto.leaderId } },
                            supervisor: { connect: { id: dto.supervisorId } },
                            host: { connect: { id: dto.hostId } },
                            title: dto.title,
                            description: dto.description,
                            date: dateOf(dto.date),
                            recurrenceEndDate: dto.recurrenceEndDate
                                ? dateOf(dto.recurrenceEndDate)
                                : null,
                            startTime: timeOf(dto.startTime),
                            endTime: timeOf(dto.endTime),
                            location: dto.location,
                            latitude: dto.latitude,
                            longitude: dto.longitude,
                            frequency: FREQUENCY_TO_DB[dto.frequency],
                            monthlyMode: dto.monthlyMode
                                ? MONTHLY_MODE_TO_DB[dto.monthlyMode]
                                : null,
                            weekOrdinal: dto.weekOrdinal,
                            weekday: dto.weekday,
                            expectedAttendees: dto.expectedAttendees,
                            isActive: dto.isActive,
                            isPublic: dto.isPublic,
                            notes: dto.notes,
                            color: dto.color,
                            ...(dto.coSupervisorIds.length
                                ? {
                                      coSupervisors: {
                                          create: dto.coSupervisorIds.map((memberId) => ({
                                              memberId,
                                          })),
                                      },
                                  }
                                : {}),
                        },
                        include: meetingInclude,
                    })

                    return transaction.meeting.update({
                        where: { id: created.id },
                        data: {
                            code: nextMeetingCode(
                                created.sector.zone.district.code,
                                created.sector.zone.code,
                                created.sector.code,
                                created.type.codeSegment,
                                existingCodes.map((item) => item.code),
                            ),
                        },
                        include: meetingInclude,
                    })
                },
                { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
            )
            return toMeetingRecord(meeting)
        } catch (error) {
            if (!isRetryableCodeError(error) || attempt === 2) mapPrismaError(error)
        }
    }

    throw new Error('No fue posible generar el código de la reunión')
}

export async function updateMeeting(id: number, dto: UpdateMeetingDto) {
    const data = buildScalarData(dto)
    if (dto.typeId !== undefined) data.type = { connect: { id: dto.typeId } }
    if (dto.sectorId !== undefined) data.sector = { connect: { id: dto.sectorId } }
    if (dto.leaderId !== undefined) data.leader = { connect: { id: dto.leaderId } }
    if (dto.supervisorId !== undefined) data.supervisor = { connect: { id: dto.supervisorId } }
    if (dto.hostId !== undefined) data.host = { connect: { id: dto.hostId } }
    if (dto.coSupervisorIds !== undefined) {
        data.coSupervisors = {
            deleteMany: {},
            create: dto.coSupervisorIds.map((memberId) => ({ memberId })),
        }
    }

    const mustRegenerateCode = dto.sectorId !== undefined || dto.typeId !== undefined

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            const meeting = await prisma.$transaction(
                async (transaction) => {
                    const updated = await transaction.meeting.update({
                        where: { id },
                        data,
                        include: meetingInclude,
                    })

                    if (!mustRegenerateCode) return updated

                    const existingCodes = await transaction.meeting.findMany({
                        where: {
                            sectorId: updated.sectorId,
                            typeId: updated.typeId,
                            id: { not: updated.id },
                        },
                        select: { code: true },
                    })
                    const expectedCode = nextMeetingCode(
                        updated.sector.zone.district.code,
                        updated.sector.zone.code,
                        updated.sector.code,
                        updated.type.codeSegment,
                        existingCodes.map((item) => item.code),
                    )
                    if (updated.code === expectedCode) return updated

                    return transaction.meeting.update({
                        where: { id },
                        data: { code: expectedCode },
                        include: meetingInclude,
                    })
                },
                { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
            )
            return toMeetingRecord(meeting)
        } catch (error) {
            if (!mustRegenerateCode || !isRetryableCodeError(error) || attempt === 2) {
                mapPrismaError(error)
            }
        }
    }

    throw new Error('No fue posible regenerar el código de la reunión')
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
    return prisma.meetingType
        .create({ data: { ...dto, description: null, color: '#e9c176' } })
        .catch(mapPrismaError)
}

export function updateMeetingType(id: number, dto: UpdateMeetingTypeDto) {
    return prisma.meetingType.update({ where: { id }, data: dto }).catch(mapPrismaError)
}

export function deleteMeetingType(id: number) {
    return prisma.meetingType.delete({ where: { id } }).catch(mapPrismaError)
}

export function countMeetingsForType(id: number) {
    return prisma.meeting.count({ where: { typeId: id } })
}

export function findMeetingTypeByName(name: string, excludeId?: number) {
    return prisma.meetingType.findFirst({
        where: {
            name: { equals: name, mode: 'insensitive' },
            ...(excludeId ? { id: { not: excludeId } } : {}),
        },
    })
}

export function findMeetingTypeByCodeSegment(codeSegment: string, excludeId?: number) {
    return prisma.meetingType.findFirst({
        where: {
            codeSegment,
            ...(excludeId ? { id: { not: excludeId } } : {}),
        },
    })
}

function isRetryableCodeError(error: unknown) {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2034')
    )
}
