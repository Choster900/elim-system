import type { Prisma } from '@prisma/client'
import {
    MEMBER_COUNTRIES,
    MEMBER_DEPARTMENTS,
    MEMBER_MUNICIPALITIES,
} from '../constants/member.constants'
import { prisma } from '../database/prisma'
import type { CreateMemberDto, UpdateMemberDto } from '../dto/member/member.dto'
import { nextSequentialCode } from '../utils/code/entity-code.util'
import { mapPrismaError } from '../utils/database/prisma-error.util'

const memberInclude = {
    communityRoles: { include: { role: true } },
    ministries: { include: { ministry: true } },
    territorySector: { include: { zone: { include: { district: true } } } },
} satisfies Prisma.MemberInclude

type MemberWithRelations = Prisma.MemberGetPayload<{ include: typeof memberInclude }>

export interface ResolvedMemberRelations {
    roleIds?: number[]
    ministryIds?: number[]
    territorySectorId?: number | null
}

function fullName(member: {
    firstName: string
    middleName: string | null
    lastName: string
    secondLastName: string | null
}) {
    return [member.firstName, member.middleName, member.lastName, member.secondLastName]
        .filter(Boolean)
        .join(' ')
}

function serializeDate(value: Date | null | undefined) {
    return value ? value.toISOString() : null
}

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase()
}

function residenceCatalogs(member: MemberWithRelations) {
    const municipalityKey = normalize(member.municipality ?? '')
    const municipality = municipalityKey
        ? MEMBER_MUNICIPALITIES.find(
              (item) =>
                  normalize(item.code) === municipalityKey ||
                  normalize(item.name) === municipalityKey ||
                  ('aliases' in item &&
                      item.aliases.some((alias) => normalize(alias) === municipalityKey)),
          )
        : null
    const departmentKey = normalize(member.department ?? '')
    const department = municipality
        ? MEMBER_DEPARTMENTS.find((item) => item.code === municipality.departmentCode)
        : MEMBER_DEPARTMENTS.find(
              (item) =>
                  normalize(item.code) === departmentKey || normalize(item.name) === departmentKey,
          )
    const country = department
        ? MEMBER_COUNTRIES.find((item) => item.code === department.countryCode)
        : null

    return { country, department, municipality }
}

function serializeMember(member: MemberWithRelations) {
    const linkedSector = member.territorySector
    const linkedZone = linkedSector?.zone
    const linkedDistrict = linkedZone?.district
    const residence = residenceCatalogs(member)

    return {
        id: member.id,
        code: member.code,
        firstName: member.firstName,
        middleName: member.middleName,
        lastName: member.lastName,
        secondLastName: member.secondLastName,
        preferredName: member.preferredName,
        documentNumber: member.documentNumber,
        birthDate: serializeDate(member.birthDate),
        gender: member.gender,
        maritalStatus: member.maritalStatus,
        phone: member.phone,
        alternatePhone: member.alternatePhone,
        email: member.email,
        address: member.address,
        country: residence.country?.name ?? null,
        countryCode: residence.country?.code ?? null,
        municipality: residence.municipality?.name ?? member.municipality,
        municipalityCode: residence.municipality?.code ?? null,
        department: residence.department?.name ?? member.department,
        departmentCode: residence.department?.code ?? null,
        occupation: member.occupation,
        status: member.status,
        roles: member.communityRoles.map((item) => item.role.code),
        ministries: member.ministries.map((item) => item.ministry.name),
        joinedAt: serializeDate(member.joinedAt),
        conversionDate: serializeDate(member.conversionDate),
        baptismDate: serializeDate(member.baptismDate),
        district: linkedDistrict?.name ?? null,
        zone: linkedZone?.name ?? null,
        sector: linkedSector?.name ?? null,
        districtCode: linkedDistrict?.code ?? null,
        zoneCode: linkedZone?.code ?? null,
        sectorCode: linkedSector?.code ?? null,
        smallGroup: member.smallGroup,
        emergencyContactName: member.emergencyContactName,
        emergencyContactPhone: member.emergencyContactPhone,
        notes: member.notes,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
        fullName: fullName(member),
    }
}

function toDate(value: string | null | undefined) {
    return value ? new Date(`${value.slice(0, 10)}T00:00:00.000Z`) : null
}

function scalarData(dto: CreateMemberDto | UpdateMemberDto) {
    const {
        roles: _roles,
        ministries: _ministries,
        country: _country,
        sector: _sector,
        birthDate,
        joinedAt,
        conversionDate,
        baptismDate,
        ...fields
    } = dto

    return {
        ...fields,
        ...(birthDate === undefined ? {} : { birthDate: toDate(birthDate) }),
        ...(joinedAt === undefined ? {} : { joinedAt: toDate(joinedAt) }),
        ...(conversionDate === undefined ? {} : { conversionDate: toDate(conversionDate) }),
        ...(baptismDate === undefined ? {} : { baptismDate: toDate(baptismDate) }),
    }
}

function isRetryableCodeError(error: unknown) {
    if (!error || typeof error !== 'object' || !('code' in error)) return false
    return error.code === 'P2002' || error.code === 'P2034'
}

export async function findMembers() {
    const members = await prisma.member.findMany({
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: memberInclude,
    })

    return members.map(serializeMember)
}

export function findMemberById(id: number) {
    return prisma.member.findUnique({ where: { id }, include: memberInclude })
}

export function findMemberMatches(code?: string, documentNumber?: string | null) {
    const filters: Prisma.MemberWhereInput[] = []
    if (code) filters.push({ code })
    if (documentNumber) filters.push({ documentNumber })
    if (!filters.length) return Promise.resolve([])

    return prisma.member.findMany({
        where: { OR: filters },
        select: { id: true, code: true, documentNumber: true },
    })
}

export async function findMemberCatalogs() {
    const [roles, ministries, districts, zones, sectors] = await prisma.$transaction([
        prisma.communityRole.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: { id: true, code: true, name: true },
        }),
        prisma.ministry.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: { id: true, code: true, name: true },
        }),
        prisma.district.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: { id: true, code: true, name: true },
        }),
        prisma.zone.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: { id: true, districtId: true, code: true, name: true },
        }),
        prisma.territorySector.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: { id: true, zoneId: true, code: true, name: true },
        }),
    ])

    return { roles, ministries, districts, zones, sectors }
}

export async function createMember(
    dto: CreateMemberDto,
    relations: Required<Pick<ResolvedMemberRelations, 'roleIds' | 'ministryIds'>> &
        Pick<ResolvedMemberRelations, 'territorySectorId'>,
) {
    const requestedCode = dto.code?.trim().toUpperCase()

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            const member = await prisma.$transaction(
                async (transaction) => {
                    const codes = requestedCode
                        ? []
                        : await transaction.member.findMany({
                              where: { code: { startsWith: 'MIE-' } },
                              select: { code: true },
                          })
                    const code =
                        requestedCode ??
                        nextSequentialCode(
                            'MIE',
                            codes.map((item) => item.code),
                            4,
                        )

                    return transaction.member.create({
                        data: {
                            ...scalarData(dto),
                            code,
                            ...(relations.territorySectorId
                                ? {
                                      territorySector: {
                                          connect: { id: relations.territorySectorId },
                                      },
                                  }
                                : {}),
                            communityRoles: {
                                create: relations.roleIds.map((roleId) => ({ roleId })),
                            },
                            ministries: {
                                create: relations.ministryIds.map((ministryId) => ({ ministryId })),
                            },
                        } as Prisma.MemberCreateInput,
                        include: memberInclude,
                    })
                },
                { isolationLevel: 'Serializable' },
            )

            return serializeMember(member as MemberWithRelations)
        } catch (error) {
            if (attempt < 2 && !requestedCode && isRetryableCodeError(error)) continue
            mapPrismaError(error)
        }
    }

    throw new Error('No fue posible generar un código único para el miembro')
}

export async function updateMember(
    id: number,
    dto: UpdateMemberDto,
    relations: ResolvedMemberRelations,
) {
    try {
        const member = await prisma.$transaction((transaction) =>
            transaction.member.update({
                where: { id },
                data: {
                    ...scalarData(dto),
                    ...(relations.territorySectorId === undefined
                        ? {}
                        : { territorySectorId: relations.territorySectorId }),
                    ...(relations.roleIds === undefined
                        ? {}
                        : {
                              communityRoles: {
                                  deleteMany: {},
                                  create: relations.roleIds.map((roleId) => ({ roleId })),
                              },
                          }),
                    ...(relations.ministryIds === undefined
                        ? {}
                        : {
                              ministries: {
                                  deleteMany: {},
                                  create: relations.ministryIds.map((ministryId) => ({
                                      ministryId,
                                  })),
                              },
                          }),
                },
                include: memberInclude,
            }),
        )

        return serializeMember(member)
    } catch (error) {
        mapPrismaError(error)
    }
}

export function deleteMember(id: number) {
    return prisma.member.delete({ where: { id } }).catch(mapPrismaError)
}
