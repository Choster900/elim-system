import { prisma } from '../database/prisma'
import type { MfaChallengePurpose } from '@prisma/client'

export function findMfaUser(userId: number) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            passwordHash: true,
            isActive: true,
            status: true,
            mfaMethod: true,
            mfaTotpSecret: true,
            mfaPendingTotpSecret: true,
            mfaPendingExpiresAt: true,
            mfaLastUsedStep: true,
            mfaVersion: true,
            mfaRecoveryCodes: { where: { usedAt: null }, select: { codeHash: true } },
        },
    })
}

export function findMfaVersion(userId: number) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: { mfaVersion: true, isActive: true, status: true },
    })
}

export function savePendingTotp(userId: number, encrypted: string, expiresAt: Date) {
    return prisma.user.update({
        where: { id: userId },
        data: { mfaPendingTotpSecret: encrypted, mfaPendingExpiresAt: expiresAt },
    })
}

export async function activateTotp(
    userId: number,
    encrypted: string,
    step: number,
    recoveryHashes: string[],
) {
    return prisma.$transaction(async (tx) => {
        const updated = await tx.user.updateMany({
            where: {
                id: userId,
                mfaMethod: 'NONE',
                mfaPendingTotpSecret: encrypted,
                mfaPendingExpiresAt: { gt: new Date() },
            },
            data: {
                mfaMethod: 'TOTP',
                twoFactorEnabled: true,
                mfaTotpSecret: encrypted,
                mfaPendingTotpSecret: null,
                mfaPendingExpiresAt: null,
                mfaLastUsedStep: step,
                mfaVersion: { increment: 1 },
            },
        })
        if (updated.count !== 1) return false
        await tx.mfaRecoveryCode.createMany({
            data: recoveryHashes.map((codeHash) => ({ userId, codeHash })),
        })
        await tx.authSession.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        })
        return true
    })
}

export async function countRecentChallenges(userId: number, purpose: MfaChallengePurpose) {
    return prisma.mfaChallenge.count({
        where: {
            userId,
            purpose,
            createdAt: { gt: new Date(Date.now() - 15 * 60_000) },
        },
    })
}

export function createChallenge(input: {
    userId: number
    purpose: MfaChallengePurpose
    tokenHash: string
    codeHash: string | null
    expiresAt: Date
}) {
    return prisma.mfaChallenge.create({ data: input })
}

export function findChallenge(tokenHash: string) {
    return prisma.mfaChallenge.findUnique({ where: { tokenHash } })
}

export function failChallengeAttempt(id: number) {
    return prisma.mfaChallenge.updateMany({
        where: { id, consumedAt: null, attempts: { lt: 5 } },
        data: { attempts: { increment: 1 } },
    })
}

export function revokeChallenge(id: number) {
    return prisma.mfaChallenge.update({ where: { id }, data: { consumedAt: new Date() } })
}

export async function consumeLoginChallenge(input: {
    challengeId: number
    userId: number
    step?: number
    recoveryHash?: string
}) {
    try {
        return await prisma.$transaction(async (tx) => {
            const now = new Date()
            const consumed = await tx.mfaChallenge.updateMany({
                where: {
                    id: input.challengeId,
                    userId: input.userId,
                    purpose: 'LOGIN',
                    consumedAt: null,
                    attempts: { lt: 5 },
                    expiresAt: { gt: now },
                },
                data: { consumedAt: now },
            })
            if (consumed.count !== 1) throw new Error('Desafío consumido')
            if (input.step !== undefined) {
                const updated = await tx.user.updateMany({
                    where: {
                        id: input.userId,
                        mfaMethod: 'TOTP',
                        OR: [{ mfaLastUsedStep: null }, { mfaLastUsedStep: { lt: input.step } }],
                    },
                    data: { mfaLastUsedStep: input.step },
                })
                if (updated.count !== 1) throw new Error('Código TOTP reutilizado')
            }
            if (input.recoveryHash) {
                const recovered = await tx.mfaRecoveryCode.updateMany({
                    where: { userId: input.userId, codeHash: input.recoveryHash, usedAt: null },
                    data: { usedAt: now },
                })
                if (recovered.count !== 1) throw new Error('Código de recuperación reutilizado')
            }
            return true
        })
    } catch {
        return false
    }
}

export async function activateEmail(userId: number, challengeId: number) {
    try {
        return await prisma.$transaction(async (tx) => {
            const consumed = await tx.mfaChallenge.updateMany({
                where: {
                    id: challengeId,
                    userId,
                    purpose: 'ENABLE_EMAIL',
                    consumedAt: null,
                    attempts: { lt: 5 },
                    expiresAt: { gt: new Date() },
                },
                data: { consumedAt: new Date() },
            })
            if (consumed.count !== 1) throw new Error('Desafío consumido')
            const updated = await tx.user.updateMany({
                where: { id: userId, mfaMethod: 'NONE' },
                data: {
                    mfaMethod: 'EMAIL',
                    twoFactorEnabled: true,
                    mfaPendingTotpSecret: null,
                    mfaPendingExpiresAt: null,
                    mfaVersion: { increment: 1 },
                },
            })
            if (updated.count !== 1) throw new Error('Método ya configurado')
            await tx.authSession.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() },
            })
            return true
        })
    } catch {
        return false
    }
}

export async function disableMfa(input: {
    userId: number
    method: 'TOTP' | 'EMAIL'
    step?: number
    recoveryHash?: string
    challengeId: number
}) {
    try {
        return await prisma.$transaction(async (tx) => {
            const now = new Date()
            const consumed = await tx.mfaChallenge.updateMany({
                where: {
                    id: input.challengeId,
                    userId: input.userId,
                    purpose: input.method === 'EMAIL' ? 'DISABLE_EMAIL' : 'DISABLE_TOTP',
                    consumedAt: null,
                    attempts: { lt: 5 },
                    expiresAt: { gt: now },
                },
                data: { consumedAt: now },
            })
            if (consumed.count !== 1) throw new Error('Desafío consumido')
            if (input.recoveryHash) {
                const recovered = await tx.mfaRecoveryCode.updateMany({
                    where: { userId: input.userId, codeHash: input.recoveryHash, usedAt: null },
                    data: { usedAt: now },
                })
                if (recovered.count !== 1) throw new Error('Código reutilizado')
            }
            const updated = await tx.user.updateMany({
                where: {
                    id: input.userId,
                    mfaMethod: input.method,
                    ...(input.step === undefined
                        ? {}
                        : {
                              OR: [
                                  { mfaLastUsedStep: null },
                                  { mfaLastUsedStep: { lt: input.step } },
                              ],
                          }),
                },
                data: {
                    mfaMethod: 'NONE',
                    twoFactorEnabled: false,
                    mfaTotpSecret: null,
                    mfaPendingTotpSecret: null,
                    mfaPendingExpiresAt: null,
                    mfaLastUsedStep: null,
                    mfaVersion: { increment: 1 },
                },
            })
            if (updated.count !== 1) throw new Error('Método cambió')
            await tx.mfaRecoveryCode.deleteMany({ where: { userId: input.userId } })
            await tx.authSession.updateMany({
                where: { userId: input.userId, revokedAt: null },
                data: { revokedAt: now },
            })
            return true
        })
    } catch {
        return false
    }
}
