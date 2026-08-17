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
        prisma.territorySector.findMany({
            include: { supervisor: true },
            orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        }),
    ])

    return {
        districts,
        zones,
        sectors: sectors.map((sector) => ({
            ...sector,
            supervisorName: sector.supervisor
                ? [
                      sector.supervisor.firstName,
                      sector.supervisor.middleName,
                      sector.supervisor.lastName,
                      sector.supervisor.secondLastName,
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
    return prisma.territorySector.findUnique({ where: { id }, include: { supervisor: true } })
}

function nextSectorCode(codes: string[]) {
    const maximum = codes.reduce((current, code) => {
        const match = /^SEC-(\d+)$/.exec(code)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)
    return `SEC-${String(maximum + 1).padStart(3, '0')}`
}

function isRetryableCodeError(error: unknown) {
    if (!error || typeof error !== 'object' || !('code' in error)) return false
    return error.code === 'P2002' || error.code === 'P2034'
}

export async function createSector(dto: CreateSectorDto, supervisorName: string) {
    const { polygon, supervisorId, ...fields } = dto

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
                            code: nextSectorCode(codes.map((item) => item.code)),
                            polygon: polygon as Prisma.InputJsonValue,
                            supervisor: { connect: { id: supervisorId } },
                            supervisorName,
                        },
                        include: { supervisor: true },
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
                include: { supervisor: true },
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
