import { createError } from 'h3'
import * as repo from '../repositories/permission.repository'
import { ApiErrorCode } from '../types/api-response.types'
import type { CreatePermissionDto } from '../dto/permission/create-permission.dto'
import type { UpdatePermissionDto } from '../dto/permission/update-permission.dto'

export async function getAllPermissions(skip: number, take: number) {
    const { items, totalItems } = await repo.findAllPermissions(skip, take)
    return {
        items: items.map(({ _count, ...permission }) => ({
            ...permission,
            description: permission.description ?? '',
            roleCount: _count.rolePermissions,
        })),
        totalItems,
    }
}

export async function getPermissionById(id: number) {
    const permission = await repo.findPermissionById(id)
    if (!permission) {
        throw createError({
            statusCode: 404,
            message: 'El permiso solicitado no existe',
            data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
        })
    }
    return permission
}

export function createPermission(dto: CreatePermissionDto) {
    return repo.createPermission(dto)
}

export async function updatePermission(id: number, dto: UpdatePermissionDto) {
    await getPermissionById(id)
    return repo.updatePermission(id, dto)
}

export async function deletePermission(id: number) {
    await getPermissionById(id)
    return repo.deletePermission(id)
}
