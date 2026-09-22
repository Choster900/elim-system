import { prisma } from '../database/prisma'
import type { CreateRoleDto, UpdateRoleDto } from '../dto/role/role.dto'
import { mapPrismaError } from '../utils/database/prisma-error.util'

const roleManagementInclude = {
    rolePermissions: { select: { permissionId: true } },
    _count: { select: { userRoles: true } },
} as const

/// Roles del sistema junto con los contadores que se muestran en administración.
export function findRolesForManagement() {
    return prisma.role.findMany({
        include: roleManagementInclude,
        orderBy: { name: 'asc' },
    })
}

export function findRoleForManagement(id: number) {
    return prisma.role.findUnique({ where: { id }, include: roleManagementInclude })
}

export function findPermissionIds(ids: number[]) {
    return prisma.permission.findMany({ where: { id: { in: ids } }, select: { id: true } })
}

export function createRole(dto: CreateRoleDto, grantedById: number) {
    return prisma.role
        .create({
            data: {
                name: dto.name,
                code: dto.code,
                description: dto.description || null,
                status: dto.status,
                rolePermissions: {
                    create: dto.permissionIds.map((permissionId) => ({
                        permissionId,
                        grantedBy: grantedById,
                    })),
                },
            },
            include: roleManagementInclude,
        })
        .catch(mapPrismaError)
}

export function updateRole(id: number, dto: UpdateRoleDto, grantedById: number, isSystem: boolean) {
    return prisma
        .$transaction(async (transaction) => {
            const permissionIds = [...new Set(dto.permissionIds)]

            await transaction.role.update({
                where: { id },
                data: {
                    ...(isSystem
                        ? {}
                        : {
                              name: dto.name,
                              code: dto.code,
                              status: dto.status,
                          }),
                    description: dto.description || null,
                },
            })

            await transaction.rolePermission.deleteMany({
                where: {
                    roleId: id,
                    permissionId: { notIn: permissionIds },
                },
            })

            await transaction.rolePermission.createMany({
                data: permissionIds.map((permissionId) => ({
                    roleId: id,
                    permissionId,
                    grantedBy: grantedById,
                })),
                skipDuplicates: true,
            })

            return transaction.role.findUniqueOrThrow({
                where: { id },
                include: roleManagementInclude,
            })
        })
        .catch(mapPrismaError)
}
