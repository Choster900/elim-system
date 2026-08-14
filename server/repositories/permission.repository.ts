import { prisma } from '../database/prisma'
import { mapPrismaError } from '../utils/database/prisma-error.util'
import type { CreatePermissionDto } from '../dto/permission/create-permission.dto'
import type { UpdatePermissionDto } from '../dto/permission/update-permission.dto'

export async function findAllPermissions(skip: number, take: number) {
    const [items, totalItems] = await prisma.$transaction([
        prisma.permission.findMany({ orderBy: { createdAt: 'desc' }, skip, take }),
        prisma.permission.count(),
    ])
    return { items, totalItems }
}

export function findPermissionById(id: number) {
    return prisma.permission.findUnique({ where: { id } })
}

export function createPermission(dto: CreatePermissionDto) {
    return prisma.permission.create({ data: dto }).catch(mapPrismaError)
}

export function updatePermission(id: number, dto: UpdatePermissionDto) {
    return prisma.permission.update({ where: { id }, data: dto }).catch(mapPrismaError)
}

export function deletePermission(id: number) {
    return prisma.permission.delete({ where: { id } }).catch(mapPrismaError)
}
