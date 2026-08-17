import { createError } from 'h3'
import type {
    CreateDistrictDto,
    CreateSectorDto,
    CreateZoneDto,
    UpdateDistrictDto,
    UpdateSectorDto,
    UpdateZoneDto,
} from '../dto/territory/territory.dto'
import * as repo from '../repositories/territory.repository'
import { ApiErrorCode } from '../types/api-response.types'

function resourceNotFound(resource: string): never {
    throw createError({
        statusCode: 404,
        message: `El ${resource} solicitado no existe`,
        data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
    })
}

async function requireSectorSupervisor(supervisorId: number) {
    const supervisor = await repo.findSectorSupervisorById(supervisorId)
    if (supervisor) return supervisor

    throw createError({
        statusCode: 400,
        message: 'El miembro seleccionado no pertenece al catálogo de supervisores',
        data: {
            code: ApiErrorCode.VALIDATION_ERROR,
            fields: { supervisorId: ['Selecciona un supervisor activo'] },
        },
    })
}

export function getTerritoryHierarchy() {
    return repo.findTerritoryHierarchy()
}

export async function getDistrictById(id: number) {
    const district = await repo.findDistrictById(id)
    if (!district) resourceNotFound('distrito')
    return district
}

export function createDistrict(dto: CreateDistrictDto) {
    return repo.createDistrict(dto)
}

export async function updateDistrict(id: number, dto: UpdateDistrictDto) {
    await getDistrictById(id)
    return repo.updateDistrict(id, dto)
}

export async function deleteDistrict(id: number) {
    await getDistrictById(id)
    return repo.deleteDistrict(id)
}

export async function getZoneById(id: number) {
    const zone = await repo.findZoneById(id)
    if (!zone) resourceNotFound('zona')
    return zone
}

export async function createZone(dto: CreateZoneDto) {
    await getDistrictById(dto.districtId)
    return repo.createZone(dto)
}

export async function updateZone(id: number, dto: UpdateZoneDto) {
    await getZoneById(id)
    if (dto.districtId !== undefined) await getDistrictById(dto.districtId)
    return repo.updateZone(id, dto)
}

export async function deleteZone(id: number) {
    await getZoneById(id)
    return repo.deleteZone(id)
}

export async function getSectorById(id: number) {
    const sector = await repo.findSectorById(id)
    if (!sector) resourceNotFound('sector')
    return sector
}

export async function createSector(dto: CreateSectorDto) {
    await getZoneById(dto.zoneId)
    const supervisor = await requireSectorSupervisor(dto.supervisorId)
    return repo.createSector(dto, supervisor.fullName)
}

export async function updateSector(id: number, dto: UpdateSectorDto) {
    await getSectorById(id)
    if (dto.zoneId !== undefined) await getZoneById(dto.zoneId)
    const supervisor =
        dto.supervisorId === undefined ? undefined : await requireSectorSupervisor(dto.supervisorId)
    return repo.updateSector(id, dto, supervisor?.fullName)
}

export async function deleteSector(id: number) {
    await getSectorById(id)
    return repo.deleteSector(id)
}

export function getSectorSupervisors() {
    return repo.findSectorSupervisors()
}
