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
    if (type?.isActive) return

    throw createError({
        statusCode: 400,
        message: 'El tipo de reunión seleccionado no está activo',
        data: {
            code: ApiErrorCode.VALIDATION_ERROR,
            fields: { typeId: ['Selecciona un tipo de reunión activo'] },
        },
    })
}

async function assertMeetingCoSupervisors(memberIds: number[], supervisorId: number) {
    if (memberIds.includes(supervisorId)) {
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

/// El modo ordinal necesita saber qué día y en qué posición del mes cae la reunión.
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
    await assertActiveMeetingType(dto.typeId)
    await assertMeetingLeader(dto.leaderId)
    await assertMeetingHost(dto.hostId)
    const supervisorId = await sectorSupervisorId(dto.sectorId)
    await assertMeetingCoSupervisors(dto.coSupervisorIds, supervisorId)
    const normalizedDto = {
        ...dto,
        supervisorId,
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
    // Las fechas pasadas de una reunión recién creada ya son pendientes.
    await resyncMeetingOccurrences(meeting.id)
    return meeting
}

export async function updateMeeting(id: number, dto: UpdateMeetingDto) {
    const existing = await getMeetingById(id)
    if (dto.typeId !== undefined) await assertActiveMeetingType(dto.typeId)
    if (dto.leaderId !== undefined) await assertMeetingLeader(dto.leaderId)
    if (dto.hostId !== undefined) await assertMeetingHost(dto.hostId)
    const supervisorId = await sectorSupervisorId(dto.sectorId ?? existing.sectorId)
    if (dto.coSupervisorIds !== undefined) {
        await assertMeetingCoSupervisors(dto.coSupervisorIds, supervisorId)
    }
    const frequency = dto.frequency ?? existing.frequency
    const normalizedDto = {
        ...dto,
        // Toda edición reactiva la reunión por defecto. La desactivación solo
        // ocurre cuando la petición envía explícitamente isActive: false.
        isActive: dto.isActive ?? true,
        supervisorId,
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
    // Cambiar la regla recalcula los pendientes; lo ya registrado no se toca.
    await resyncMeetingOccurrences(id)
    return meeting
}

export async function deleteMeeting(id: number) {
    await getMeetingById(id)
    return repo.deleteMeeting(id)
}

// --- Meeting types ---

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
