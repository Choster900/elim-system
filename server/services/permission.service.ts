import { createError } from 'h3'
import * as repo from '../repositories/permission.repository'
import { ApiErrorCode } from '../types/api-response.types'
import type { CreatePermissionDto } from '../dto/permission/create-permission.dto'
import type { UpdatePermissionDto } from '../dto/permission/update-permission.dto'

export function getAllPermissions() {
    return repo.findAllPermissions()
}

export async function getPermissionById(id: string) {
    const permission = await repo.findPermissionById(id)
    if (!permission) {
        throw createError({
            statusCode: 404,
            statusMessage: 'El permiso solicitado no existe',
            data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
        })
    }
    return permission
}

export function createPermission(dto: CreatePermissionDto) {
    return repo.createPermission(dto)
}

export async function updatePermission(id: string, dto: UpdatePermissionDto) {
    await getPermissionById(id)
    return repo.updatePermission(id, dto)
}

export async function deletePermission(id: string) {
    await getPermissionById(id)
    return repo.deletePermission(id)
}
