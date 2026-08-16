import { createError } from 'h3'
import type {
    CreateOfferingCategoryDto,
    CreateOfferingDto,
    OfferingDetailDto,
    UpdateOfferingCategoryDto,
    UpdateOfferingDto,
} from '../dto/offering/offering.dto'
import * as repo from '../repositories/offering.repository'
import { getMeetingById } from './meeting.service'
import { ApiErrorCode } from '../types/api-response.types'

function resourceNotFound(resource: string): never {
    throw createError({
        statusCode: 404,
        message: `El ${resource} solicitado no existe`,
        data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
    })
}

function businessRule(message: string): never {
    throw createError({
        statusCode: 409,
        message,
        data: { code: ApiErrorCode.BUSINESS_RULE_ERROR },
    })
}

function sectorForbidden(): never {
    throw createError({
        statusCode: 403,
        message: 'No tienes acceso a las reuniones de este sector',
        data: { code: ApiErrorCode.FORBIDDEN },
    })
}

// Ensures the target meeting belongs to a sector the user is allowed to manage.
function assertSectorAllowed(sectorId: number, allowedSectorIds?: number[]) {
    if (allowedSectorIds === undefined) return
    if (!allowedSectorIds.includes(sectorId)) sectorForbidden()
}

async function assertCategoriesExist(details: OfferingDetailDto[]) {
    const ids = [...new Set(details.map((detail) => detail.categoryId))]
    const existing = await repo.findOfferingCategoryIdsByIds(ids)
    if (existing.length !== ids.length) {
        businessRule('Una o más categorías de ofrenda no existen')
    }
}

export function getOfferings(filters: { meetingId?: number; sectorIds?: number[] } = {}) {
    return repo.findOfferings(filters)
}

export async function getOfferingById(id: number) {
    const offering = await repo.findOfferingById(id)
    if (!offering) resourceNotFound('ofrenda')
    return offering
}

export async function createOffering(
    dto: CreateOfferingDto,
    recordedById: number | null,
    allowedSectorIds?: number[],
) {
    const meeting = await getMeetingById(dto.meetingId)
    assertSectorAllowed(meeting.sectorId, allowedSectorIds)
    await assertCategoriesExist(dto.details)
    return repo.createOffering(dto, recordedById)
}

export async function updateOffering(
    id: number,
    dto: UpdateOfferingDto,
    allowedSectorIds?: number[],
) {
    const existing = await getOfferingById(id)
    const targetMeetingId = dto.meetingId ?? existing.meetingId
    const meeting = await getMeetingById(targetMeetingId)
    assertSectorAllowed(meeting.sectorId, allowedSectorIds)
    if (dto.details !== undefined) await assertCategoriesExist(dto.details)
    return repo.updateOffering(id, dto)
}

export async function deleteOffering(id: number) {
    await getOfferingById(id)
    return repo.deleteOffering(id)
}

// --- Offering categories ---

export function getOfferingCategories() {
    return repo.findOfferingCategories()
}

export async function getOfferingCategoryById(id: number) {
    const category = await repo.findOfferingCategoryById(id)
    if (!category) resourceNotFound('categoría de ofrenda')
    return category
}

export function createOfferingCategory(dto: CreateOfferingCategoryDto) {
    return repo.createOfferingCategory(dto)
}

export async function updateOfferingCategory(id: number, dto: UpdateOfferingCategoryDto) {
    await getOfferingCategoryById(id)
    return repo.updateOfferingCategory(id, dto)
}

export async function deleteOfferingCategory(id: number) {
    await getOfferingCategoryById(id)
    return repo.deleteOfferingCategory(id)
}
