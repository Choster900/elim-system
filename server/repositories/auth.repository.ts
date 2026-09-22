import { prisma } from '../database/prisma'
import { mapPrismaError } from '../utils/database/prisma-error.util'

const authGraphInclude = {
    member: {
        include: {
            territorySector: {
                include: {
                    zone: {
                        include: { district: true },
                    },
                },
            },
        },
    },
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

export function findUserByEmailForPasswordReset(email: string) {
    return prisma.user.findUnique({
        where: { email },
        include: { member: true },
    })
}

export function findUserByIdWithAuthGraph(userId: number) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: authGraphInclude,
    })
}

export function findSupervisedSectorIdsByUserId(userId: number) {
    return prisma.territorySector
        .findMany({
            where: { supervisor: { user: { id: userId } } },
            select: { id: true },
        })
        .then((sectors) => sectors.map((sector) => sector.id))
}

/// Reuniones que el usuario conduce como líder o acompaña como co-supervisor.
export function findMeetingIdsByLeaderUserId(userId: number) {
    return prisma.meeting
        .findMany({
            where: {
                OR: [
                    { leader: { user: { id: userId } } },
                    { coSupervisors: { some: { member: { user: { id: userId } } } } },
                ],
            },
            select: { id: true },
        })
        .then((meetings) => meetings.map((meeting) => meeting.id))
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

interface CreatePasswordResetTokenInput {
    userId: number
    tokenHash: string
    expiresAt: Date
}

export function createPasswordResetToken(input: CreatePasswordResetTokenInput) {
    return prisma
        .$transaction(async (transaction) => {
            await transaction.passwordResetToken.updateMany({
                where: {
                    userId: input.userId,
                    usedAt: null,
                    revokedAt: null,
                },
                data: { revokedAt: new Date() },
            })

            return transaction.passwordResetToken.create({
                data: {
                    userId: input.userId,
                    tokenHash: input.tokenHash,
                    expiresAt: input.expiresAt,
                },
            })
        })
        .catch(mapPrismaError)
}

export function findPasswordResetTokenByHash(tokenHash: string) {
    return prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: {
            user: {
                include: { member: true },
            },
        },
    })
}

export function revokePasswordResetTokenById(id: number) {
    return prisma.passwordResetToken
        .update({
            where: { id },
            data: { revokedAt: new Date() },
        })
        .catch(mapPrismaError)
}

export function consumePasswordResetToken(
    resetTokenId: number,
    userId: number,
    passwordHash: string,
) {
    return prisma
        .$transaction(async (transaction) => {
            const consumed = await transaction.passwordResetToken.updateMany({
                where: {
                    id: resetTokenId,
                    userId,
                    usedAt: null,
                    revokedAt: null,
                    expiresAt: { gt: new Date() },
                },
                data: { usedAt: new Date() },
            })
            if (consumed.count !== 1) return false

            await transaction.user.update({
                where: { id: userId },
                data: {
                    passwordHash,
                    mustChangePassword: false,
                    status: 'ACTIVE',
                },
            })
            await transaction.authSession.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() },
            })
            return true
        })
        .catch(mapPrismaError)
}
