import type { Prisma } from '@prisma/client'
import { nextTerritoryCode } from '#shared/utils/territory-code.util'
import {
    districtAutoName,
    meetingAutoTitle,
    sectorAutoName,
    zoneAutoName,
} from '#shared/utils/territory-name.util'
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

const memberNameSelect = {
    firstName: true,
    middleName: true,
    lastName: true,
    secondLastName: true,
} satisfies Prisma.MemberSelect

function memberFullName(member: Prisma.MemberGetPayload<{ select: typeof memberNameSelect }>) {
    return [member.firstName, member.middleName, member.lastName, member.secondLastName]
        .filter(Boolean)
        .join(' ')
}

function isRetryableCodeError(error: unknown) {
    if (!error || typeof error !== 'object' || !('code' in error)) return false
    return error.code === 'P2002' || error.code === 'P2034'
}

async function nextDistrictCode(transaction: Prisma.TransactionClient) {
    const districts = await transaction.district.findMany({ select: { code: true } })
    return nextTerritoryCode(
        'D',
        districts.map((item) => item.code),
    )
}

async function nextZoneCode(transaction: Prisma.TransactionClient, districtId: number) {
    const zones = await transaction.zone.findMany({
        where: { districtId },
        select: { code: true },
    })
    return nextTerritoryCode(
        'Z',
        zones.map((item) => item.code),
    )
}

async function nextSectorCode(transaction: Prisma.TransactionClient, zoneId: number) {
    const sectors = await transaction.territorySector.findMany({
        where: { zoneId },
        select: { code: true },
    })
    return nextTerritoryCode(
        'S',
        sectors.map((item) => item.code),
    )
}

function findDistrictName(transaction: Prisma.TransactionClient, id: number) {
    return transaction.district.findUniqueOrThrow({ where: { id }, select: { name: true } })
}

function findZoneWithDistrictName(transaction: Prisma.TransactionClient, id: number) {
    return transaction.zone.findUniqueOrThrow({
        where: { id },
        select: { name: true, district: { select: { name: true } } },
    })
}

async function cascadeSectorName(
    transaction: Prisma.TransactionClient,
    sectorId: number,
    previousName: string,
    nextName: string,
) {
    if (previousName === nextName) return
    const meetings = await transaction.meeting.findMany({
        where: { sectorId },
        select: { id: true, code: true, title: true },
    })
    for (const meeting of meetings) {
        if (meeting.title !== meetingAutoTitle(meeting.code, previousName)) continue
        await transaction.meeting.update({
            where: { id: meeting.id },
            data: { title: meetingAutoTitle(meeting.code, nextName) },
        })
    }
}

async function cascadeZoneName(
    transaction: Prisma.TransactionClient,
    zoneId: number,
    previous: { districtName: string; zoneName: string },
    next: { districtName: string; zoneName: string },
) {
    if (previous.districtName === next.districtName && previous.zoneName === next.zoneName) return
    const sectors = await transaction.territorySector.findMany({
        where: { zoneId },
        select: { id: true, code: true, name: true },
    })
    for (const sector of sectors) {
        if (sector.name !== sectorAutoName(previous.districtName, previous.zoneName, sector.code)) {
            continue
        }
        const name = sectorAutoName(next.districtName, next.zoneName, sector.code)
        await transaction.territorySector.update({ where: { id: sector.id }, data: { name } })
        await cascadeSectorName(transaction, sector.id, sector.name, name)
    }
}

async function cascadeDistrictName(
    transaction: Prisma.TransactionClient,
    districtId: number,
    previousName: string,
    nextName: string,
) {
    if (previousName === nextName) return
    const zones = await transaction.zone.findMany({
        where: { districtId },
        select: { id: true, code: true, name: true },
    })
    for (const zone of zones) {
        const name =
            zone.name === zoneAutoName(previousName, zone.code)
                ? zoneAutoName(nextName, zone.code)
                : zone.name
        if (name !== zone.name) {
            await transaction.zone.update({ where: { id: zone.id }, data: { name } })
        }
        await cascadeZoneName(
            transaction,
            zone.id,
            { districtName: previousName, zoneName: zone.name },
            { districtName: nextName, zoneName: name },
        )
    }
}

export async function findTerritoryHierarchy() {
    const [districts, zones, sectors] = await prisma.$transaction([
        prisma.district.findMany({
            include: { leader: { select: memberNameSelect } },
            orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        }),
        prisma.zone.findMany({
            include: { leader: { select: memberNameSelect } },
            orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        }),
        prisma.territorySector.findMany({
            include: {
                supervisor: {
                    select: memberNameSelect,
                },
            },
            orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        }),
    ])

    return {
        districts: districts.map(({ leader, ...district }) => ({
            ...district,
            leaderName: leader ? memberFullName(leader) : district.leaderName,
        })),
        zones: zones.map(({ leader, ...zone }) => ({
            ...zone,
            leaderName: leader ? memberFullName(leader) : zone.leaderName,
        })),
        sectors: sectors.map(({ supervisor, ...sector }) => ({
            ...sector,
            supervisorName: supervisor ? memberFullName(supervisor) : sector.supervisorName,
        })),
    }
}

export function findDistrictById(id: number) {
    return prisma.district.findUnique({ where: { id } })
}

export async function createDistrict(dto: CreateDistrictDto) {
    const { polygon, name, ...data } = dto

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(
                async (transaction) => {
                    const code = await nextDistrictCode(transaction)
                    return transaction.district.create({
                        data: {
                            ...data,
                            code,
                            name: name || districtAutoName(code),
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

export async function updateDistrict(id: number, dto: UpdateDistrictDto) {
    const { polygon, name, ...fields } = dto
    const data: Prisma.DistrictUncheckedUpdateInput = {
        ...fields,
        ...(polygon === undefined ? {} : { polygon: polygon as Prisma.InputJsonValue }),
    }

    try {
        return await prisma.$transaction(async (transaction) => {
            const current = await transaction.district.findUniqueOrThrow({
                where: { id },
                select: { code: true, name: true },
            })
            if (name) data.name = name
            else if (name !== undefined) data.name = districtAutoName(current.code)

            const district = await transaction.district.update({ where: { id }, data })
            await cascadeDistrictName(transaction, id, current.name, district.name)
            return district
        })
    } catch (error) {
        mapPrismaError(error)
    }
}

export function deleteDistrict(id: number) {
    return prisma.district.delete({ where: { id } }).catch(mapPrismaError)
}

export function findZoneById(id: number) {
    return prisma.zone.findUnique({ where: { id } })
}

export async function createZone(dto: CreateZoneDto) {
    const { polygon, name, ...data } = dto

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(
                async (transaction) => {
                    const code = await nextZoneCode(transaction, data.districtId)
                    const district = await findDistrictName(transaction, data.districtId)
                    return transaction.zone.create({
                        data: {
                            ...data,
                            code,
                            name: name || zoneAutoName(district.name, code),
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

export async function updateZone(id: number, dto: UpdateZoneDto) {
    const { polygon, name, ...fields } = dto

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(
                async (transaction) => {
                    const data: Prisma.ZoneUncheckedUpdateInput = {
                        ...fields,
                        ...(polygon === undefined
                            ? {}
                            : { polygon: polygon as Prisma.InputJsonValue }),
                        ...(name ? { name } : {}),
                    }
                    const current = await transaction.zone.findUniqueOrThrow({
                        where: { id },
                        select: {
                            name: true,
                            code: true,
                            districtId: true,
                            district: { select: { name: true } },
                        },
                    })
                    const districtId = fields.districtId ?? current.districtId
                    const moved = districtId !== current.districtId
                    const code = moved ? await nextZoneCode(transaction, districtId) : current.code
                    if (moved) data.code = code

                    const district = moved
                        ? await findDistrictName(transaction, districtId)
                        : current.district
                    const hadAutoName =
                        current.name === zoneAutoName(current.district.name, current.code)
                    const nameCleared = name !== undefined && !name
                    if (nameCleared || (name === undefined && moved && hadAutoName)) {
                        data.name = zoneAutoName(district.name, code)
                    }

                    const zone = await transaction.zone.update({ where: { id }, data })
                    await cascadeZoneName(
                        transaction,
                        id,
                        { districtName: current.district.name, zoneName: current.name },
                        { districtName: district.name, zoneName: zone.name },
                    )
                    return zone
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

export function deleteZone(id: number) {
    return prisma.zone.delete({ where: { id } }).catch(mapPrismaError)
}

export function findSectorById(id: number) {
    return prisma.territorySector.findUnique({ where: { id } })
}

export async function createSector(dto: CreateSectorDto, supervisorName: string | null) {
    const { polygon, supervisorId, zoneId, name, ...fields } = dto

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(
                async (transaction) => {
                    const code = await nextSectorCode(transaction, zoneId)
                    const zone = await findZoneWithDistrictName(transaction, zoneId)
                    return transaction.territorySector.create({
                        data: {
                            ...fields,
                            code,
                            name: name || sectorAutoName(zone.district.name, zone.name, code),
                            polygon: polygon as Prisma.InputJsonValue,
                            zone: { connect: { id: zoneId } },
                            ...(supervisorId
                                ? { supervisor: { connect: { id: supervisorId } } }
                                : {}),
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
    const { polygon, supervisorId, zoneId, name, ...fields } = dto

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(
                async (transaction) => {
                    const data: Prisma.TerritorySectorUpdateInput = {
                        ...fields,
                        ...(polygon === undefined
                            ? {}
                            : { polygon: polygon as Prisma.InputJsonValue }),
                        ...(zoneId === undefined ? {} : { zone: { connect: { id: zoneId } } }),
                        ...(name ? { name } : {}),
                    }
                    if (supervisorId !== undefined) {
                        data.supervisor = supervisorId
                            ? { connect: { id: supervisorId } }
                            : { disconnect: true }
                        data.supervisorName = supervisorName ?? null
                    }

                    const current = await transaction.territorySector.findUniqueOrThrow({
                        where: { id },
                        select: {
                            name: true,
                            code: true,
                            zoneId: true,
                            zone: { select: { name: true, district: { select: { name: true } } } },
                        },
                    })
                    const targetZoneId = zoneId ?? current.zoneId
                    const moved = targetZoneId !== current.zoneId
                    const code = moved
                        ? await nextSectorCode(transaction, targetZoneId)
                        : current.code
                    if (moved) data.code = code

                    const hadAutoName =
                        current.name ===
                        sectorAutoName(current.zone.district.name, current.zone.name, current.code)
                    const nameCleared = name !== undefined && !name
                    if (nameCleared || (name === undefined && moved && hadAutoName)) {
                        const zone = moved
                            ? await findZoneWithDistrictName(transaction, targetZoneId)
                            : current.zone
                        data.name = sectorAutoName(zone.district.name, zone.name, code)
                    }

                    const sector = await transaction.territorySector.update({
                        where: { id },
                        data,
                    })
                    await cascadeSectorName(transaction, id, current.name, sector.name)

                    if (supervisorId) {
                        await transaction.meeting.updateMany({
                            where: { sectorId: id },
                            data: { supervisorId },
                        })
                    }

                    return sector
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

export function deleteSector(id: number) {
    return prisma.territorySector.delete({ where: { id } }).catch(mapPrismaError)
}

export async function findSectorSupervisors() {
    return findActiveCommunityRoleMembers('SUPERVISOR')
}

export async function findTerritoryLeaders() {
    return findActiveCommunityRoleMembers('PASTOR')
}

export async function findZoneCoordinators() {
    return findActiveCommunityRoleMembers('COORDINATOR')
}

async function findActiveCommunityRoleMembers(roleCode: string) {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const members = await prisma.member.findMany({
        where: {
            status: 'ACTIVE',
            communityRoles: {
                some: {
                    role: { code: roleCode, isActive: true },
                    AND: [
                        { OR: [{ startedAt: null }, { startedAt: { lte: today } }] },
                        { OR: [{ endedAt: null }, { endedAt: { gte: today } }] },
                    ],
                },
            },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    return members.map((member) => ({
        id: member.id,
        code: member.code,
        fullName: memberFullName(member),
        documentNumber: member.documentNumber,
        email: member.email,
        phone: member.phone,
    }))
}

export async function findSectorSupervisorById(id: number) {
    const supervisors = await findSectorSupervisors()
    return supervisors.find((supervisor) => supervisor.id === id) ?? null
}

export async function findTerritoryLeaderById(id: number) {
    const leaders = await findTerritoryLeaders()
    return leaders.find((leader) => leader.id === id) ?? null
}

export async function findZoneCoordinatorById(id: number) {
    const coordinators = await findZoneCoordinators()
    return coordinators.find((coordinator) => coordinator.id === id) ?? null
}
