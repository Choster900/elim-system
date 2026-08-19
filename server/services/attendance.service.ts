import { createError } from 'h3'
import type {
    CreateAttendanceTypeDto,
    UpdateAttendanceTypeDto,
} from '../dto/attendance/attendance.dto'
import * as repo from '../repositories/attendance.repository'
import { ApiErrorCode } from '../types/api-response.types'

function resourceNotFound(): never {
    throw createError({
        statusCode: 404,
        message: 'El tipo de asistencia solicitado no existe',
        data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
    })
}

export function getAttendanceTypes() {
    return repo.findAttendanceTypes()
}

export async function getAttendanceTypeById(id: number) {
    const type = await repo.findAttendanceTypeById(id)
    if (!type) resourceNotFound()
    return type
}

export function createAttendanceType(dto: CreateAttendanceTypeDto) {
    return repo.createAttendanceType(dto)
}

export async function updateAttendanceType(id: number, dto: UpdateAttendanceTypeDto) {
    await getAttendanceTypeById(id)
    return repo.updateAttendanceType(id, dto)
}

/**
 * Un tipo con fechas ya registradas no se borra: eso reescribiría el histórico.
 * Para sacarlo de la captura se desactiva, y las fechas viejas lo conservan.
 */
export async function deleteAttendanceType(id: number) {
    await getAttendanceTypeById(id)

    const used = await repo.countAttendanceDetailsByType(id)
    if (used > 0) {
        throw createError({
            statusCode: 409,
            message: `Este tipo ya tiene ${used} ${used === 1 ? 'registro' : 'registros'}; desactívalo en vez de eliminarlo`,
            data: { code: ApiErrorCode.BUSINESS_RULE_ERROR },
        })
    }

    return repo.deleteAttendanceType(id)
}
