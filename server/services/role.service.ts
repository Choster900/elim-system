import * as repository from '../repositories/role.repository'
import type { CreateRoleDto, UpdateRoleDto } from '../dto/role/role.dto'
import { createError } from 'h3'
import { ApiErrorCode } from '../types/api-response.types'

function mapRole(role: NonNullable<Awaited<ReturnType<typeof repository.findRoleForManagement>>>) {
    return {
        id: role.id,
        name: role.name,
        code: role.code,
        description: role.description ?? '',
        isSystem: role.isSystem,
        status: role.status,
        userCount: role._count.userRoles,
        permissionIds: role.rolePermissions.map(({ permissionId }) => permissionId),
        updatedAt: role.updatedAt.toISOString(),
    }
}

function roleNotFound(): never {
    throw createError({
        statusCode: 404,
        message: 'El rol solicitado no existe',
        data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
    })
}

async function assertPermissionsExist(permissionIds: number[]) {
    const ids = [...new Set(permissionIds)]
    const permissions = await repository.findPermissionIds(ids)
    if (permissions.length === ids.length) return
    throw createError({
        statusCode: 400,
        message: 'Uno o más permisos seleccionados no existen',
        data: {
            code: ApiErrorCode.VALIDATION_ERROR,
            fields: { permissionIds: ['Selecciona únicamente permisos existentes.'] },
        },
    })
}

/// Forma de administración independiente de los detalles internos de Prisma.
export async function getRolesForManagement() {
    const roles = await repository.findRolesForManagement()

    return roles.map(mapRole)
}

export async function createRole(dto: CreateRoleDto, userId: number) {
    await assertPermissionsExist(dto.permissionIds)
    return mapRole(await repository.createRole(dto, userId))
}

export async function updateRole(id: number, dto: UpdateRoleDto, userId: number) {
    const existing = await repository.findRoleForManagement(id)
    if (!existing) roleNotFound()
    await assertPermissionsExist(dto.permissionIds)
    return mapRole(await repository.updateRole(id, dto, userId, existing.isSystem))
}
