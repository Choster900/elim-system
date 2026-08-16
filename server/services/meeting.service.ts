import { createError } from 'h3'
import type {
    CreateMeetingDto,
    CreateMeetingTypeDto,
    UpdateMeetingDto,
    UpdateMeetingTypeDto,
} from '../dto/meeting/meeting.dto'
import * as repo from '../repositories/meeting.repository'
import { ApiErrorCode } from '../types/api-response.types'

function resourceNotFound(resource: string): never {
    throw createError({
        statusCode: 404,
        message: `El ${resource} solicitado no existe`,
        data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
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

export function createMeeting(dto: CreateMeetingDto) {
    return repo.createMeeting(dto)
}

export async function updateMeeting(id: number, dto: UpdateMeetingDto) {
    await getMeetingById(id)
    return repo.updateMeeting(id, dto)
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
