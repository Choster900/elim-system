import { prisma } from '../database/prisma'
import { mapPrismaError } from '../utils/prisma-error.util'

const authGraphInclude = {
    userRoles: {
        include: {
            role: {
                include: {
                    rolePermissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            },
        },
    },
} as const

export function findUserByEmailWithAuthGraph(email: string) {
    return prisma.user.findUnique({
        where: { email },
        include: authGraphInclude,
    })
}

export function findUserByIdWithAuthGraph(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: authGraphInclude,
    })
}

interface CreateAuthSessionInput {
    id: string
    userId: string
    refreshTokenHash: string
    expiresAt: Date
}

export function createAuthSession(input: CreateAuthSessionInput) {
    return prisma.authSession
        .create({
            data: {
                id: input.id,
                userId: input.userId,
                refreshTokenHash: input.refreshTokenHash,
                expiresAt: input.expiresAt,
            },
        })
        .catch(mapPrismaError)
}

export function findAuthSessionById(id: string) {
    return prisma.authSession.findUnique({ where: { id } })
}

export function revokeAuthSessionById(id: string) {
    return prisma.authSession
        .update({
            where: { id },
            data: { revokedAt: new Date() },
        })
        .catch(mapPrismaError)
}

export function deleteExpiredOrRevokedAuthSessions(userId: string) {
    return prisma.authSession.deleteMany({
        where: {
            userId,
            OR: [{ revokedAt: { not: null } }, { expiresAt: { lt: new Date() } }],
        },
    })
}
