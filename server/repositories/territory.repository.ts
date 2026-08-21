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
import { nextSequentialCode } from '../utils/code/entity-code.util'
import { mapPrismaError } from '../utils/database/prisma-error.util'

/// Colisión de único o conflicto de serialización: el correlativo se recalcula.
function isRetryableCodeError(error: unknown) {
    if (!error || typeof error !== 'object' || !('code' in error)) return false
    return error.code === 'P2002' || error.code === 'P2034'
}

export async function findTerritoryHierarchy() {
    const [districts, zones, sectors] = await prisma.$transaction([
        prisma.district.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] }),
        prisma.zone.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] }),
        prisma.territorySector.findMany({
            include: {
                supervisor: {
                    select: {
                        firstName: true,
                        middleName: true,
                        lastName: true,
                        secondLastName: true,
                    },
                },
            },
            orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        }),
    ])

    return {
        districts,
        zones,
        sectors: sectors.map(({ supervisor, ...sector }) => ({
            ...sector,
            supervisorName: supervisor
                ? [
                      supervisor.firstName,
                      supervisor.middleName,
                      supervisor.lastName,
                      supervisor.secondLastName,
                  ]
                      .filter(Boolean)
                      .join(' ')
                : sector.supervisorName,
        })),
    }
}

export function findDistrictById(id: number) {
    return prisma.district.findUnique({ where: { id } })
}

export async function createDistrict(dto: CreateDistrictDto) {
    const { polygon, ...data } = dto

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(
                async (transaction) => {
                    const codes = await transaction.district.findMany({
                        where: { code: { startsWith: 'DIS-' } },
                        select: { code: true },
                    })
                    return transaction.district.create({
                        data: {
                            ...data,
                            code: nextSequentialCode(
                                'DIS',
                                codes.map((item) => item.code),
                            ),
                            polygon: polygon as Prisma.InputJsonValue,
                        },
                    })
                },
                { isolationLevel: 'Serializable' },
            )
        } catch (error) {
            if (attempt < 2 && isRetryableCodeError(error)) continue
            mapPrismaError(error)
        }
    }

    throw new Error('No fue posible generar un código único para el distrito')
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

export async function createZone(dto: CreateZoneDto) {
    const { polygon, ...data } = dto

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(
                async (transaction) => {
                    const codes = await transaction.zone.findMany({
                        where: { code: { startsWith: 'ZON-' } },
                        select: { code: true },
                    })
                    return transaction.zone.create({
                        data: {
                            ...data,
                            code: nextSequentialCode(
                                'ZON',
                                codes.map((item) => item.code),
                            ),
                            polygon: polygon as Prisma.InputJsonValue,
                        },
                    })
                },
                { isolationLevel: 'Serializable' },
            )
        } catch (error) {
            if (attempt < 2 && isRetryableCodeError(error)) continue
            mapPrismaError(error)
        }
    }

    throw new Error('No fue posible generar un código único para la zona')
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

export async function createSector(dto: CreateSectorDto, supervisorName: string) {
    const { polygon, supervisorId, zoneId, ...fields } = dto

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(
                async (transaction) => {
                    const codes = await transaction.territorySector.findMany({
                        where: { code: { startsWith: 'SEC-' } },
                        select: { code: true },
                    })
                    return transaction.territorySector.create({
                        data: {
                            ...fields,
                            code: nextSequentialCode(
                                'SEC',
                                codes.map((item) => item.code),
                            ),
                            polygon: polygon as Prisma.InputJsonValue,
                            zone: { connect: { id: zoneId } },
                            supervisor: { connect: { id: supervisorId } },
                            supervisorName,
                        },
                    })
                },
                { isolationLevel: 'Serializable' },
            )
        } catch (error) {
            if (attempt < 2 && isRetryableCodeError(error)) continue
            mapPrismaError(error)
        }
    }

    throw new Error('No fue posible generar un código único para el sector')
}

export async function updateSector(id: number, dto: UpdateSectorDto, supervisorName?: string) {
    const { polygon, supervisorId, ...fields } = dto
    const data: Prisma.TerritorySectorUpdateInput = {
        ...fields,
        ...(polygon === undefined ? {} : { polygon: polygon as Prisma.InputJsonValue }),
    }
    if (supervisorId !== undefined) {
        data.supervisor = { connect: { id: supervisorId } }
        data.supervisorName = supervisorName ?? null
    }

    try {
        return await prisma.$transaction(async (transaction) => {
            const sector = await transaction.territorySector.update({
                where: { id },
                data,
            })

            if (supervisorId !== undefined) {
                await transaction.meeting.updateMany({
                    where: { sectorId: id },
                    data: { supervisorId },
                })
            }

            return sector
        })
    } catch (error) {
        mapPrismaError(error)
    }
}

export function deleteSector(id: number) {
    return prisma.territorySector.delete({ where: { id } }).catch(mapPrismaError)
}

export async function findSectorSupervisors() {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const supervisors = await prisma.member.findMany({
        where: {
            status: 'ACTIVE',
            communityRoles: {
                some: {
                    role: { code: 'SUPERVISOR', isActive: true },
                    AND: [
                        { OR: [{ startedAt: null }, { startedAt: { lte: today } }] },
                        { OR: [{ endedAt: null }, { endedAt: { gte: today } }] },
                    ],
                },
            },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    return supervisors.map((supervisor) => ({
        id: supervisor.id,
        code: supervisor.code,
        fullName: [
            supervisor.firstName,
            supervisor.middleName,
            supervisor.lastName,
            supervisor.secondLastName,
        ]
            .filter(Boolean)
            .join(' '),
        email: supervisor.email,
        phone: supervisor.phone,
    }))
}

export async function findSectorSupervisorById(id: number) {
    const supervisors = await findSectorSupervisors()
    return supervisors.find((supervisor) => supervisor.id === id) ?? null
}
