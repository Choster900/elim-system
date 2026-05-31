import { prisma } from '../database/prisma'
import { mapPrismaError } from '../utils/prisma-error.util'
import type { CreatePermissionDto } from '../dto/permission/create-permission.dto'
import type { UpdatePermissionDto } from '../dto/permission/update-permission.dto'

export function findAllPermissions() {
    return prisma.permission.findMany({ orderBy: { createdAt: 'desc' } })
}

export function findPermissionById(id: string) {
    return prisma.permission.findUnique({ where: { id } })
}

export function createPermission(dto: CreatePermissionDto) {
    return prisma.permission.create({ data: dto }).catch(mapPrismaError)
}

export function updatePermission(id: string, dto: UpdatePermissionDto) {
    return prisma.permission.update({ where: { id }, data: dto }).catch(mapPrismaError)
}

export function deletePermission(id: string) {
    return prisma.permission.delete({ where: { id } }).catch(mapPrismaError)
}
