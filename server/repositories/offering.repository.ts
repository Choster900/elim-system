import { prisma } from '../database/prisma'
import type {
    CreateOfferingCategoryDto,
    UpdateOfferingCategoryDto,
} from '../dto/offering/offering.dto'
import { mapPrismaError } from '../utils/database/prisma-error.util'

// La captura de ofrendas vive en occurrence.repository.ts; aquí solo el catálogo.

export function findOfferingCategories() {
    return prisma.offeringCategory.findMany({
        orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    })
}

export function findOfferingCategoryById(id: number) {
    return prisma.offeringCategory.findUnique({ where: { id } })
}

export function findOfferingCategoryIdsByIds(ids: number[]) {
    return prisma.offeringCategory
        .findMany({ where: { id: { in: ids } }, select: { id: true } })
        .then((rows) => rows.map((row) => row.id))
}

export function createOfferingCategory(dto: CreateOfferingCategoryDto) {
    return prisma.offeringCategory.create({ data: dto }).catch(mapPrismaError)
}

export function updateOfferingCategory(id: number, dto: UpdateOfferingCategoryDto) {
    return prisma.offeringCategory.update({ where: { id }, data: dto }).catch(mapPrismaError)
}

export function deleteOfferingCategory(id: number) {
    return prisma.offeringCategory.delete({ where: { id } }).catch(mapPrismaError)
}
