import { createError } from 'h3'
import type {
    CreateMeetingDto,
    CreateMeetingTypeDto,
    MeetingFrequencyValue,
    MonthlyModeValue,
    UpdateMeetingDto,
    UpdateMeetingTypeDto,
} from '../dto/meeting/meeting.dto'
import * as repo from '../repositories/meeting.repository'
import { resyncMeetingOccurrences } from './meeting-occurrence.service'
import { getSectorById } from './territory.service'
import { ApiErrorCode } from '../types/api-response.types'

function resourceNotFound(resource: string): never {
    throw createError({
        statusCode: 404,
        message: `El ${resource} solicitado no existe`,
        data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
    })
}

async function assertMeetingLeader(memberId: number) {
    if (await repo.isMeetingLeader(memberId)) return

    throw createError({
        statusCode: 400,
        message: 'El miembro seleccionado no tiene un rol Líder activo',
        data: {
            code: ApiErrorCode.VALIDATION_ERROR,
            fields: { leaderId: ['Selecciona un miembro con rol Líder activo'] },
        },
    })
}

async function assertMeetingHost(memberId: number) {
    if (await repo.isMeetingHost(memberId)) return

    throw createError({
        statusCode: 400,
        message: 'El miembro seleccionado no tiene un rol Anfitrión activo',
        data: {
            code: ApiErrorCode.VALIDATION_ERROR,
            fields: { hostId: ['Selecciona un miembro con rol Anfitrión activo'] },
        },
    })
}

async function assertActiveMeetingType(typeId: number) {
    const type = await repo.findMeetingTypeById(typeId)
    if (type?.isActive) return type

    throw createError({
        statusCode: 400,
        message: 'El tipo de reunión seleccionado no está activo',
        data: {
            code: ApiErrorCode.VALIDATION_ERROR,
            fields: { typeId: ['Selecciona un tipo de reunión activo'] },
        },
    })
}

async function assertMeetingCoSupervisors(memberIds: number[], supervisorId: number | null) {
    if (supervisorId !== null && memberIds.includes(supervisorId)) {
        throw createError({
            statusCode: 400,
            message: 'El supervisor principal no puede repetirse como co-supervisor',
            data: {
                code: ApiErrorCode.VALIDATION_ERROR,
                fields: { coSupervisorIds: ['El supervisor principal ya está asignado al sector'] },
            },
        })
    }

    const assignments = await Promise.all(
        memberIds.map(async (memberId) => ({
            memberId,
            isSupervisor: await repo.isMeetingSupervisor(memberId),
        })),
    )
    if (assignments.every((assignment) => assignment.isSupervisor)) return

    throw createError({
        statusCode: 400,
        message: 'Uno de los co-supervisores no tiene un rol comunitario Supervisor activo',
        data: {
            code: ApiErrorCode.VALIDATION_ERROR,
            fields: {
                coSupervisorIds: ['Selecciona miembros con rol comunitario Supervisor activo'],
            },
        },
    })
}

async function sectorSupervisorId(sectorId: number) {
    const sector = await getSectorById(sectorId)
    if (sector.supervisorId) return sector.supervisorId

    throw createError({
        statusCode: 409,
        message: 'El sector debe tener un supervisor antes de asignarle reuniones',
        data: {
            code: ApiErrorCode.BUSINESS_RULE_ERROR,
            fields: { sectorId: ['Asigna un supervisor al sector seleccionado'] },
        },
    })
}

function missingField(field: 'sectorId' | 'leaderId' | 'hostId', message: string): never {
    throw createError({
        statusCode: 400,
        message,
        data: { code: ApiErrorCode.VALIDATION_ERROR, fields: { [field]: [message] } },
    })
}

interface MeetingAssignment {
    sectorId: number | null
    leaderId: number | null
    hostId: number | null
    coSupervisorIds: number[]
}

const GENERAL_ASSIGNMENT = {
    leaderId: null,
    supervisorId: null,
    hostId: null,
    coSupervisorIds: [] as number[],
}

async function resolveSectorAssignment(
    input: MeetingAssignment,
    checks = { leader: true, host: true, coSupervisors: true },
) {
    if (checks.leader) {
        if (input.leaderId === null) missingField('leaderId', 'Selecciona el líder de la reunión')
        await assertMeetingLeader(input.leaderId)
    }
    if (checks.host) {
        if (input.hostId === null) missingField('hostId', 'Selecciona el anfitrión de la reunión')
        await assertMeetingHost(input.hostId)
    }
    const supervisorId = input.sectorId === null ? null : await sectorSupervisorId(input.sectorId)
    if (checks.coSupervisors) await assertMeetingCoSupervisors(input.coSupervisorIds, supervisorId)

    return { ...input, supervisorId }
}

function assertValidRecurrence(
    date: string,
    frequency: MeetingFrequencyValue,
    recurrenceEndDate: string | null,
) {
    if (frequency === 'unica' || recurrenceEndDate === null) return
    if (recurrenceEndDate >= date) return

    throw createError({
        statusCode: 400,
        message: 'La fecha final de recurrencia no puede ser anterior a la fecha de inicio',
        data: {
            code: ApiErrorCode.VALIDATION_ERROR,
            fields: {
                recurrenceEndDate: ['Selecciona una fecha igual o posterior al inicio'],
            },
        },
    })
}

function assertValidMonthlyRule(
    frequency: MeetingFrequencyValue,
    monthlyMode: MonthlyModeValue | null,
    weekOrdinal: number | null,
    weekday: number | null,
) {
    if (frequency !== 'mensual' || monthlyMode !== 'ordinal') return
    if (weekOrdinal !== null && weekday !== null) return

    throw createError({
        statusCode: 400,
        message: 'Una recurrencia mensual por ordinal necesita el día de la semana y su posición',
        data: {
            code: ApiErrorCode.VALIDATION_ERROR,
            fields: {
                weekOrdinal: ['Indica la posición dentro del mes'],
                weekday: ['Indica el día de la semana'],
            },
        },
    })
}

export function getMeetings(filters: { sectorIds?: number[]; meetingIds?: number[] } = {}) {
    return repo.findMeetings(filters)
}

export async function getMeetingById(id: number) {
    const meeting = await repo.findMeetingById(id)
    if (!meeting) resourceNotFound('reunión')
    return meeting
}

export function getMeetingLeaders() {
    return repo.findMeetingLeaders()
}

export function getMeetingSupervisors() {
    return repo.findMeetingSupervisors()
}

export function getMeetingHosts() {
    return repo.findMeetingHosts()
}

export async function createMeeting(dto: CreateMeetingDto) {
    const type = await assertActiveMeetingType(dto.typeId)
    const assignment = type.isGeneral
        ? { ...GENERAL_ASSIGNMENT, sectorId: null }
        : await resolveSectorAssignment(dto)
    const normalizedDto = {
        ...dto,
        ...assignment,
        recurrenceEndDate: dto.frequency === 'unica' ? null : dto.recurrenceEndDate,
    }
    assertValidRecurrence(
        normalizedDto.date,
        normalizedDto.frequency,
        normalizedDto.recurrenceEndDate,
    )
    assertValidMonthlyRule(
        normalizedDto.frequency,
        normalizedDto.monthlyMode,
        normalizedDto.weekOrdinal,
        normalizedDto.weekday,
    )

    const meeting = await repo.createMeeting(normalizedDto)
    await resyncMeetingOccurrences(meeting.id)
    return meeting
}

export async function updateMeeting(id: number, dto: UpdateMeetingDto) {
    const existing = await getMeetingById(id)
    const type =
        dto.typeId !== undefined
            ? await assertActiveMeetingType(dto.typeId)
            : { isGeneral: existing.isGeneral }
    const frequency = dto.frequency ?? existing.frequency
    const normalizedDto = {
        ...dto,
        ...(await resolveUpdatedAssignment(existing, dto, type.isGeneral)),
        isActive: dto.isActive ?? true,
        ...(frequency === 'unica' ? { recurrenceEndDate: null } : {}),
    }
    assertValidRecurrence(
        normalizedDto.date ?? existing.date,
        frequency,
        normalizedDto.recurrenceEndDate !== undefined
            ? normalizedDto.recurrenceEndDate
            : existing.recurrenceEndDate,
    )
    assertValidMonthlyRule(
        frequency,
        normalizedDto.monthlyMode !== undefined ? normalizedDto.monthlyMode : existing.monthlyMode,
        normalizedDto.weekOrdinal !== undefined ? normalizedDto.weekOrdinal : existing.weekOrdinal,
        normalizedDto.weekday !== undefined ? normalizedDto.weekday : existing.weekday,
    )

    const meeting = await repo.updateMeeting(id, normalizedDto)
    await resyncMeetingOccurrences(id)
    return meeting
}

async function resolveUpdatedAssignment(
    existing: Awaited<ReturnType<typeof getMeetingById>>,
    dto: UpdateMeetingDto,
    isGeneral: boolean,
) {
    if (isGeneral) {
        return {
            ...GENERAL_ASSIGNMENT,
            ...(existing.sectorId !== null ? { sectorId: null } : {}),
        }
    }

    const wasGeneral = existing.isGeneral
    const assignment = await resolveSectorAssignment(
        {
            sectorId: dto.sectorId !== undefined ? dto.sectorId : existing.sectorId,
            leaderId: dto.leaderId !== undefined ? dto.leaderId : existing.leaderId,
            hostId: dto.hostId !== undefined ? dto.hostId : existing.hostId,
            coSupervisorIds: dto.coSupervisorIds ?? existing.coSupervisorIds,
        },
        {
            leader: wasGeneral || dto.leaderId !== undefined,
            host: wasGeneral || dto.hostId !== undefined,
            coSupervisors: wasGeneral || dto.coSupervisorIds !== undefined,
        },
    )

    return {
        supervisorId: assignment.supervisorId,
        ...(wasGeneral || dto.sectorId !== undefined ? { sectorId: assignment.sectorId } : {}),
        ...(wasGeneral || dto.leaderId !== undefined ? { leaderId: assignment.leaderId } : {}),
        ...(wasGeneral || dto.hostId !== undefined ? { hostId: assignment.hostId } : {}),
        ...(wasGeneral || dto.coSupervisorIds !== undefined
            ? { coSupervisorIds: assignment.coSupervisorIds }
            : {}),
    }
}

export async function deleteMeeting(id: number) {
    await getMeetingById(id)
    return repo.deleteMeeting(id)
}

export function getMeetingTypes() {
    return repo.findMeetingTypes()
}

export async function getMeetingTypeById(id: number) {
    const type = await repo.findMeetingTypeById(id)
    if (!type) resourceNotFound('tipo de reunión')
    return type
}

async function assertMeetingTypeUnique(
    dto: Pick<CreateMeetingTypeDto, 'name' | 'codeSegment'>,
    excludeId?: number,
) {
    const [sameName, sameSegment] = await Promise.all([
        repo.findMeetingTypeByName(dto.name, excludeId),
        repo.findMeetingTypeByCodeSegment(dto.codeSegment, excludeId),
    ])
    if (!sameName && !sameSegment) return

    throw createError({
        statusCode: 409,
        message: 'El nombre o segmento del tipo de reunión ya está en uso',
        data: {
            code: ApiErrorCode.RESOURCE_ALREADY_EXISTS,
            fields: {
                ...(sameName ? { name: ['Ya existe un tipo con este nombre'] } : {}),
                ...(sameSegment ? { codeSegment: ['Este segmento ya está en uso'] } : {}),
            },
        },
    })
}

export async function createMeetingType(dto: CreateMeetingTypeDto) {
    const normalizedDto = {
        ...dto,
        name: dto.name.trim(),
        codeSegment: dto.codeSegment.toUpperCase(),
    }
    await assertMeetingTypeUnique(normalizedDto)
    return repo.createMeetingType(normalizedDto)
}

export async function updateMeetingType(id: number, dto: UpdateMeetingTypeDto) {
    const existing = await getMeetingTypeById(id)
    const normalizedDto = {
        ...dto,
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.codeSegment !== undefined ? { codeSegment: dto.codeSegment.toUpperCase() } : {}),
    }
    if (normalizedDto.codeSegment && normalizedDto.codeSegment !== existing.codeSegment) {
        if (await repo.countMeetingsForType(id)) {
            throw createError({
                statusCode: 409,
                message: 'No se puede cambiar el segmento de un tipo con reuniones registradas',
                data: { code: ApiErrorCode.BUSINESS_RULE_ERROR },
            })
        }
    }
    if (
        normalizedDto.isGeneral !== undefined &&
        normalizedDto.isGeneral !== existing.isGeneral &&
        (await repo.countMeetingsForType(id))
    ) {
        throw createError({
            statusCode: 409,
            message: 'No se puede cambiar el alcance de un tipo con reuniones registradas',
            data: { code: ApiErrorCode.BUSINESS_RULE_ERROR },
        })
    }
    if (normalizedDto.name || normalizedDto.codeSegment) {
        await assertMeetingTypeUnique(
            {
                name: normalizedDto.name ?? existing.name,
                codeSegment: normalizedDto.codeSegment ?? existing.codeSegment,
            },
            id,
        )
    }
    return repo.updateMeetingType(id, normalizedDto)
}

export async function deleteMeetingType(id: number) {
    await getMeetingTypeById(id)
    if (await repo.countMeetingsForType(id)) {
        throw createError({
            statusCode: 409,
            message: 'No se puede eliminar un tipo con reuniones registradas',
            data: { code: ApiErrorCode.BUSINESS_RULE_ERROR },
        })
    }
    return repo.deleteMeetingType(id)
}
