import { createError } from 'h3'
import {
    MEMBER_COUNTRIES,
    MEMBER_DEPARTMENTS,
    MEMBER_GENDER_OPTIONS,
    MEMBER_MARITAL_STATUS_OPTIONS,
    MEMBER_MUNICIPALITIES,
    MEMBER_STATUS_OPTIONS,
} from '../constants/member.constants'
import type {
    CreateMemberDto,
    ImportMembersDto,
    MemberImportResultDto,
    UpdateMemberDto,
} from '../dto/member/member.dto'
import * as repo from '../repositories/member.repository'
import { ApiErrorCode } from '../types/api-response.types'
import { createMemberSchema } from '../validators/member.validator'

type MemberCatalogs = Awaited<ReturnType<typeof repo.findMemberCatalogs>>

const FIELD_LABELS: Record<string, string> = {
    code: 'Código',
    firstName: 'Nombres',
    lastName: 'Apellidos',
    documentNumber: 'Documento',
    birthDate: 'Fecha de nacimiento',
    gender: 'Género',
    maritalStatus: 'Estado civil',
    email: 'Correo',
    country: 'País',
    department: 'Departamento',
    municipality: 'Municipio',
    status: 'Estado',
    roles: 'Roles',
    ministries: 'Ministerios',
    joinedAt: 'Fecha de ingreso',
    conversionDate: 'Fecha de conversión',
    baptismDate: 'Fecha de bautismo',
    sector: 'Sector',
}

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase()
}

function validationError(fields: Record<string, string[]>): never {
    throw createError({
        statusCode: 400,
        message: 'Los datos del miembro no son válidos',
        data: { code: ApiErrorCode.VALIDATION_ERROR, fields },
    })
}

function notFound(): never {
    throw createError({
        statusCode: 404,
        message: 'El miembro solicitado no existe',
        data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
    })
}

function resolveCatalogItem<T extends { code: string; name: string; aliases?: readonly string[] }>(
    items: readonly T[],
    input: string,
    field: string,
) {
    const key = normalize(input)
    const matches = items.filter(
        (item) =>
            normalize(item.code) === key ||
            normalize(item.name) === key ||
            item.aliases?.some((alias) => normalize(alias) === key),
    )
    if (matches.length === 1) return matches[0]!
    if (matches.length > 1)
        validationError({ [field]: [`${input} es ambiguo; utiliza el código.`] })
    validationError({ [field]: [`${input} no pertenece al catálogo activo.`] })
}

function resolveRoles(values: string[], catalogs: MemberCatalogs) {
    return values.map((value) => resolveCatalogItem(catalogs.roles, value, 'roles').id)
}

function resolveMinistries(values: string[], catalogs: MemberCatalogs) {
    return values.map((value) => resolveCatalogItem(catalogs.ministries, value, 'ministries').id)
}

function resolveTerritory(dto: CreateMemberDto | UpdateMemberDto, catalogs: MemberCatalogs) {
    if (dto.sector === undefined) return undefined
    const sectorInput = dto.sector?.trim() || ''
    const sector = sectorInput ? resolveCatalogItem(catalogs.sectors, sectorInput, 'sector') : null

    return {
        sector: sector?.name ?? null,
        territorySectorId: sector?.id ?? null,
    }
}

function resolveResidence(dto: CreateMemberDto | UpdateMemberDto) {
    const residenceTouched = ['country', 'department', 'municipality'].some(
        (field) => dto[field as keyof typeof dto] !== undefined,
    )
    if (!residenceTouched) return undefined

    const countryInput = dto.country?.trim() || ''
    const departmentInput = dto.department?.trim() || ''
    const municipalityInput = dto.municipality?.trim() || ''
    let country = countryInput
        ? resolveCatalogItem(MEMBER_COUNTRIES, countryInput, 'country')
        : null
    let department = departmentInput
        ? resolveCatalogItem(
              country
                  ? MEMBER_DEPARTMENTS.filter((item) => item.countryCode === country!.code)
                  : MEMBER_DEPARTMENTS,
              departmentInput,
              'department',
          )
        : null
    const municipality = municipalityInput
        ? resolveCatalogItem(
              department
                  ? MEMBER_MUNICIPALITIES.filter((item) => item.departmentCode === department!.code)
                  : MEMBER_MUNICIPALITIES,
              municipalityInput,
              'municipality',
          )
        : null

    if (municipality) {
        const municipalityDepartment = MEMBER_DEPARTMENTS.find(
            (item) => item.code === municipality.departmentCode,
        )
        if (department && municipalityDepartment?.code !== department.code) {
            validationError({
                municipality: [
                    `${municipality.name} no pertenece al departamento ${department.name}.`,
                ],
            })
        }
        department = municipalityDepartment ?? null
    }

    if (department) {
        const departmentCountry = MEMBER_COUNTRIES.find(
            (item) => item.code === department!.countryCode,
        )
        if (country && departmentCountry?.code !== country.code) {
            validationError({
                department: [`${department.name} no pertenece al país ${country.name}.`],
            })
        }
        country = departmentCountry ?? null
    }

    return {
        country: country?.name ?? null,
        department: department?.name ?? null,
        municipality: municipality?.name ?? null,
    }
}

function normalizeMemberDto<T extends CreateMemberDto | UpdateMemberDto>(
    dto: T,
    territory?: ReturnType<typeof resolveTerritory>,
    residence?: ReturnType<typeof resolveResidence>,
) {
    return {
        ...dto,
        ...(dto.code === undefined ? {} : { code: dto.code.trim().toUpperCase() }),
        ...(dto.email === undefined
            ? {}
            : { email: dto.email ? dto.email.trim().toLowerCase() : null }),
        ...(dto.documentNumber === undefined
            ? {}
            : { documentNumber: dto.documentNumber?.trim() || null }),
        ...(residence ? residence : {}),
        ...(territory ? { sector: territory.sector } : {}),
    } as T
}

async function prepareMember(dto: CreateMemberDto | UpdateMemberDto, catalogs: MemberCatalogs) {
    const territory = resolveTerritory(dto, catalogs)
    const residence = resolveResidence(dto)
    return {
        dto: normalizeMemberDto(dto, territory, residence),
        relations: {
            ...(dto.roles === undefined ? {} : { roleIds: resolveRoles(dto.roles, catalogs) }),
            ...(dto.ministries === undefined
                ? {}
                : { ministryIds: resolveMinistries(dto.ministries, catalogs) }),
            ...(territory === undefined ? {} : { territorySectorId: territory.territorySectorId }),
        },
    }
}

function joiReasons(error: { details: Array<{ path: Array<string | number>; message: string }> }) {
    return error.details.map(({ path, message }) => {
        const field = String(path[0] ?? '')
        const label = FIELD_LABELS[field] ?? (field || 'Campo')
        const normalizedMessage = message
            .replace(/^"[^"]+"\s*/, '')
            .replace('is required', 'es obligatorio')
            .replace('is not allowed to be empty', 'no puede estar vacío')
            .replace('must be a valid email', 'debe ser un correo válido')
            .replace('must be in ISO 8601 date format', 'debe ser una fecha válida')
            .replace('must be one of', 'debe usar uno de los valores permitidos:')
        return `${label}: ${normalizedMessage}`
    })
}

function errorReasons(error: unknown) {
    const typed = error as {
        message?: string
        statusMessage?: string
        data?: { fields?: Record<string, string[]> }
    }
    if (typed.data?.fields) {
        return Object.entries(typed.data.fields).flatMap(([field, messages]) =>
            messages.map((message) => `${FIELD_LABELS[field] ?? field}: ${message}`),
        )
    }
    return [typed.statusMessage || typed.message || 'No fue posible guardar este miembro.']
}

export function getMembers() {
    return repo.findMembers()
}

export async function getMemberCatalogs() {
    const catalogs = await repo.findMemberCatalogs()
    const districtById = new Map(catalogs.districts.map((item) => [item.id, item]))
    const zoneById = new Map(catalogs.zones.map((item) => [item.id, item]))

    return {
        statuses: MEMBER_STATUS_OPTIONS,
        genders: MEMBER_GENDER_OPTIONS,
        maritalStatuses: MEMBER_MARITAL_STATUS_OPTIONS,
        countries: MEMBER_COUNTRIES.map((item) => ({
            value: item.code,
            label: item.name,
            code: item.code,
        })),
        departments: MEMBER_DEPARTMENTS.map((item) => ({
            value: item.code,
            label: item.name,
            code: item.code,
            countryCode: item.countryCode,
        })),
        municipalities: MEMBER_MUNICIPALITIES.map((item) => ({
            value: item.code,
            label: item.name,
            code: item.code,
            departmentCode: item.departmentCode,
        })),
        roles: catalogs.roles.map((item) => ({ value: item.code, label: item.name })),
        ministries: catalogs.ministries.map((item) => ({
            value: item.name,
            label: item.name,
            code: item.code,
        })),
        districts: catalogs.districts.map((item) => ({
            value: item.code,
            label: item.name,
            code: item.code,
        })),
        zones: catalogs.zones.map((item) => ({
            value: item.code,
            label: item.name,
            code: item.code,
            districtCode: districtById.get(item.districtId)?.code ?? '',
        })),
        sectors: catalogs.sectors.map((item) => ({
            value: item.code,
            label: item.name,
            code: item.code,
            zoneCode: zoneById.get(item.zoneId)?.code ?? '',
        })),
    }
}

export async function getMemberById(id: number) {
    const member = await repo.findMemberById(id)
    if (!member) notFound()
    return member
}

export async function createMember(dto: CreateMemberDto) {
    const catalogs = await repo.findMemberCatalogs()
    const prepared = await prepareMember(dto, catalogs)
    return repo.createMember(prepared.dto as CreateMemberDto, {
        roleIds: prepared.relations.roleIds ?? [],
        ministryIds: prepared.relations.ministryIds ?? [],
        territorySectorId: prepared.relations.territorySectorId ?? null,
    })
}

export async function updateMember(id: number, dto: UpdateMemberDto) {
    await getMemberById(id)
    const catalogs = await repo.findMemberCatalogs()
    const prepared = await prepareMember(dto, catalogs)
    return repo.updateMember(id, prepared.dto, prepared.relations)
}

export async function deleteMember(id: number) {
    await getMemberById(id)
    return repo.deleteMember(id)
}

async function importOneMember(dto: CreateMemberDto, catalogs: MemberCatalogs) {
    const prepared = await prepareMember(dto, catalogs)
    const normalizedDto = prepared.dto as CreateMemberDto
    const matches = await repo.findMemberMatches(normalizedDto.code, normalizedDto.documentNumber)
    if (matches.length > 1) {
        validationError({
            documentNumber: [
                'El código y el documento pertenecen a miembros diferentes; revisa la fila.',
            ],
        })
    }

    const existing = matches[0]
    if (existing) {
        await repo.updateMember(existing.id, normalizedDto, prepared.relations)
        return 'updated' as const
    }

    await repo.createMember(normalizedDto, {
        roleIds: prepared.relations.roleIds ?? [],
        ministryIds: prepared.relations.ministryIds ?? [],
        territorySectorId: prepared.relations.territorySectorId ?? null,
    })
    return 'created' as const
}

export async function importMembers(dto: ImportMembersDto): Promise<MemberImportResultDto> {
    const catalogs = await repo.findMemberCatalogs()
    const result: MemberImportResultDto = {
        created: 0,
        updated: 0,
        rejected: 0,
        total: dto.rows.length,
        failures: [],
    }
    const seenCodes = new Set<string>()
    const seenDocuments = new Set<string>()

    for (const row of dto.rows) {
        const validation = createMemberSchema.validate(row.member, {
            abortEarly: false,
            stripUnknown: true,
        })
        if (validation.error) {
            result.failures.push({
                rowNumber: row.rowNumber,
                reasons: joiReasons(validation.error),
            })
            result.rejected += 1
            continue
        }

        const member = validation.value
        const code = member.code?.trim().toUpperCase()
        const documentNumber = member.documentNumber?.trim()
        const duplicateReasons: string[] = []
        if (code && seenCodes.has(code))
            duplicateReasons.push(`Código duplicado en el archivo: ${code}.`)
        if (documentNumber && seenDocuments.has(documentNumber)) {
            duplicateReasons.push(`Documento duplicado en el archivo: ${documentNumber}.`)
        }
        if (code) seenCodes.add(code)
        if (documentNumber) seenDocuments.add(documentNumber)

        if (duplicateReasons.length) {
            result.failures.push({ rowNumber: row.rowNumber, reasons: duplicateReasons })
            result.rejected += 1
            continue
        }

        try {
            const action = await importOneMember(member, catalogs)
            result[action] += 1
        } catch (error) {
            result.failures.push({ rowNumber: row.rowNumber, reasons: errorReasons(error) })
            result.rejected += 1
        }
    }

    return result
}
