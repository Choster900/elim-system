import { createError } from 'h3'
import type {
    CreateOfferingCategoryDto,
    UpdateOfferingCategoryDto,
} from '../dto/offering/offering.dto'
import * as repo from '../repositories/offering.repository'
import { ApiErrorCode } from '../types/api-response.types'

// La captura de ofrendas vive en meeting-occurrence.service.ts; aquí solo el catálogo.

function resourceNotFound(): never {
    throw createError({
        statusCode: 404,
        message: 'La categoría de ofrenda solicitada no existe',
        data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
    })
}

export function getOfferingCategories() {
    return repo.findOfferingCategories()
}

export async function getOfferingCategoryById(id: number) {
    const category = await repo.findOfferingCategoryById(id)
    if (!category) resourceNotFound()
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
