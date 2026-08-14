import type { Prisma } from '@prisma/client'
import { prisma } from '../database/prisma'
import type {
    CreateDistrictDto,
    CreateSectorDto,
    CreateZoneDto,
    UpdateDistrictDto,
    UpdateSectorDto,
    UpdateZoneDto,
} from '../dto/territory/territory.dto'
import { mapPrismaError } from '../utils/database/prisma-error.util'

export async function findTerritoryHierarchy() {
    const [districts, zones, sectors] = await prisma.$transaction([
        prisma.district.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] }),
        prisma.zone.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] }),
        prisma.territorySector.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] }),
    ])

    return { districts, zones, sectors }
}

export function findDistrictById(id: number) {
    return prisma.district.findUnique({ where: { id } })
}

export function createDistrict(dto: CreateDistrictDto) {
    const { polygon, ...data } = dto
    return prisma.district
        .create({ data: { ...data, polygon: polygon as Prisma.InputJsonValue } })
        .catch(mapPrismaError)
}

export function updateDistrict(id: number, dto: UpdateDistrictDto) {
    const { polygon, ...data } = dto
    return prisma.district
        .update({
            where: { id },
            data: {
                ...data,
                ...(polygon === undefined ? {} : { polygon: polygon as Prisma.InputJsonValue }),
            },
        })
        .catch(mapPrismaError)
}

export function deleteDistrict(id: number) {
    return prisma.district.delete({ where: { id } }).catch(mapPrismaError)
}

export function findZoneById(id: number) {
    return prisma.zone.findUnique({ where: { id } })
}

export function createZone(dto: CreateZoneDto) {
    const { polygon, ...data } = dto
    return prisma.zone
        .create({ data: { ...data, polygon: polygon as Prisma.InputJsonValue } })
        .catch(mapPrismaError)
}

export function updateZone(id: number, dto: UpdateZoneDto) {
    const { polygon, ...data } = dto
    return prisma.zone
        .update({
            where: { id },
            data: {
                ...data,
                ...(polygon === undefined ? {} : { polygon: polygon as Prisma.InputJsonValue }),
            },
        })
        .catch(mapPrismaError)
}

export function deleteZone(id: number) {
    return prisma.zone.delete({ where: { id } }).catch(mapPrismaError)
}

export function findSectorById(id: number) {
    return prisma.territorySector.findUnique({ where: { id } })
}

export function createSector(dto: CreateSectorDto) {
    const { polygon, ...data } = dto
    return prisma.territorySector
        .create({ data: { ...data, polygon: polygon as Prisma.InputJsonValue } })
        .catch(mapPrismaError)
}

export function updateSector(id: number, dto: UpdateSectorDto) {
    const { polygon, ...data } = dto
    return prisma.territorySector
        .update({
            where: { id },
            data: {
                ...data,
                ...(polygon === undefined ? {} : { polygon: polygon as Prisma.InputJsonValue }),
            },
        })
        .catch(mapPrismaError)
}

export function deleteSector(id: number) {
    return prisma.territorySector.delete({ where: { id } }).catch(mapPrismaError)
}
