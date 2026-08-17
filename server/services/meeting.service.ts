import { createError } from 'h3'
import type {
    CreateMeetingDto,
    CreateMeetingTypeDto,
    MeetingFrequencyValue,
    UpdateMeetingDto,
    UpdateMeetingTypeDto,
} from '../dto/meeting/meeting.dto'
import * as repo from '../repositories/meeting.repository'
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

export function getMeetings(filters: { sectorIds?: number[] } = {}) {
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

export async function createMeeting(dto: CreateMeetingDto) {
    await assertMeetingLeader(dto.leaderId)
    const supervisorId = await sectorSupervisorId(dto.sectorId)
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
    return repo.createMeeting(normalizedDto)
}

export async function updateMeeting(id: number, dto: UpdateMeetingDto) {
    const existing = await getMeetingById(id)
    if (dto.leaderId !== undefined) await assertMeetingLeader(dto.leaderId)
    const supervisorId = await sectorSupervisorId(dto.sectorId ?? existing.sectorId)
    const frequency = dto.frequency ?? existing.frequency
    const normalizedDto = {
        ...dto,
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
    return repo.updateMeeting(id, normalizedDto)
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

export function createMeetingType(dto: CreateMeetingTypeDto) {
    return repo.createMeetingType(dto)
}

export async function updateMeetingType(id: number, dto: UpdateMeetingTypeDto) {
    await getMeetingTypeById(id)
    return repo.updateMeetingType(id, dto)
}

export async function deleteMeetingType(id: number) {
    await getMeetingTypeById(id)
    return repo.deleteMeetingType(id)
}
