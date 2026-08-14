import { prisma } from '../database/prisma'
import { mapPrismaError } from '../utils/database/prisma-error.util'

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

export function findUserByIdWithAuthGraph(userId: number) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: authGraphInclude,
    })
}

interface CreateAuthSessionInput {
    tokenId: string
    userId: number
    refreshTokenHash: string
    expiresAt: Date
}

export function createAuthSession(input: CreateAuthSessionInput) {
    return prisma.authSession
        .create({
            data: {
                tokenId: input.tokenId,
                userId: input.userId,
                refreshTokenHash: input.refreshTokenHash,
                expiresAt: input.expiresAt,
            },
        })
        .catch(mapPrismaError)
}

export function findAuthSessionByTokenId(tokenId: string) {
    return prisma.authSession.findUnique({ where: { tokenId } })
}

export function revokeAuthSessionById(id: number) {
    return prisma.authSession
        .update({
            where: { id },
            data: { revokedAt: new Date() },
        })
        .catch(mapPrismaError)
}

export function deleteExpiredOrRevokedAuthSessions(userId: number) {
    return prisma.authSession.deleteMany({
        where: {
            userId,
            OR: [{ revokedAt: { not: null } }, { expiresAt: { lt: new Date() } }],
        },
    })
}
