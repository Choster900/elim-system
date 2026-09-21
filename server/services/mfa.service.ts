import { randomBytes } from 'node:crypto'
import { createError } from 'h3'
import type { MfaChallengePurpose } from '@prisma/client'
import * as repository from '../repositories/mfa.repository'
import { findUserByIdWithAuthGraph } from '../repositories/auth.repository'
import { recordUserAccess } from '../repositories/user.repository'
import { verifyPassword } from '../utils/auth/password.util'
import {
    buildTotpUri,
    createEmailCode,
    createRecoveryCodes,
    createTotpSecret,
    decryptTotpSecret,
    encryptTotpSecret,
    hashMfaValue,
    matchingTotpStep,
    sameMfaHash,
} from '../utils/auth/mfa.util'
import { sendMfaCodeEmail } from './email.service'

const CHALLENGE_TTL_MS = 5 * 60_000
const SETUP_TTL_MS = 10 * 60_000

function mfaError(message: string, statusCode = 400) {
    return createError({
        statusCode,
        message,
        data: { code: statusCode === 429 ? 'RATE_LIMITED' : 'MFA_ERROR' },
    })
}

async function activeUser(userId: number) {
    const user = await repository.findMfaUser(userId)
    if (!user || !user.isActive || user.status !== 'ACTIVE') {
        throw mfaError('La cuenta no está habilitada', 403)
    }
    return user
}

async function checkPassword(userId: number, password: string) {
    const user = await activeUser(userId)
    if (!(await verifyPassword(password, user.passwordHash))) {
        throw mfaError('La contraseña actual es incorrecta', 401)
    }
    return user
}

async function issueChallenge(userId: number, purpose: MfaChallengePurpose, emailCode: boolean) {
    if ((await repository.countRecentChallenges(userId, purpose)) >= 5) {
        throw mfaError('Se solicitaron demasiados códigos. Intenta de nuevo en 15 minutos.', 429)
    }
    const token = randomBytes(32).toString('base64url')
    const code = emailCode ? createEmailCode() : null
    const challenge = await repository.createChallenge({
        userId,
        purpose,
        tokenHash: hashMfaValue(token),
        codeHash: code ? hashMfaValue(`${token}:${code}`) : null,
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    })
    if (code) {
        const user = await activeUser(userId)
        try {
            await sendMfaCodeEmail({ email: user.email, code, purpose })
        } catch {
            await repository.revokeChallenge(challenge.id)
            throw mfaError('No fue posible enviar el código por correo', 502)
        }
    }
    return { challengeToken: token, expiresIn: CHALLENGE_TTL_MS / 1000 }
}

async function validChallenge(token: string, purpose: MfaChallengePurpose, userId?: number) {
    const challenge = await repository.findChallenge(hashMfaValue(token))
    if (
        !challenge ||
        challenge.purpose !== purpose ||
        (userId !== undefined && challenge.userId !== userId) ||
        challenge.consumedAt ||
        challenge.expiresAt.getTime() <= Date.now() ||
        challenge.attempts >= 5
    ) {
        throw mfaError('El desafío expiró o ya no está disponible', 401)
    }
    return challenge
}

async function verifyEmailChallenge(
    token: string,
    code: string,
    purpose: MfaChallengePurpose,
    userId?: number,
) {
    const challenge = await validChallenge(token, purpose, userId)
    if (!sameMfaHash(challenge.codeHash, hashMfaValue(`${token}:${code}`))) {
        await repository.failChallengeAttempt(challenge.id)
        throw mfaError('El código es incorrecto o expiró', 401)
    }
    return challenge
}

function totpProof(user: Awaited<ReturnType<typeof activeUser>>, code: string) {
    if (!user.mfaTotpSecret) throw mfaError('TOTP no está configurado', 409)
    const normalized = code.replace(/[\s-]/g, '').toUpperCase()
    if (/^[A-F0-9]{16}$/.test(normalized)) {
        const recoveryHash = hashMfaValue(normalized)
        return user.mfaRecoveryCodes.some(({ codeHash }) => sameMfaHash(codeHash, recoveryHash))
            ? { recoveryHash }
            : null
    }
    const step = matchingTotpStep(decryptTotpSecret(user.mfaTotpSecret), normalized)
    if (step === null || (user.mfaLastUsedStep !== null && step <= user.mfaLastUsedStep)) {
        return null
    }
    return { step }
}

export async function mfaSettings(userId: number) {
    const user = await activeUser(userId)
    return {
        method: user.mfaMethod,
        email: user.email,
        recoveryCodesRemaining: user.mfaRecoveryCodes.length,
        phoneAvailable: false,
    }
}

export async function startTotpSetup(userId: number, password: string) {
    const user = await checkPassword(userId, password)
    if (user.mfaMethod !== 'NONE') throw mfaError('Desactiva primero el método actual', 409)
    const secret = createTotpSecret()
    await repository.savePendingTotp(
        userId,
        encryptTotpSecret(secret),
        new Date(Date.now() + SETUP_TTL_MS),
    )
    return { secret, otpauthUri: buildTotpUri(secret, user.email), expiresIn: SETUP_TTL_MS / 1000 }
}

export async function confirmTotpSetup(userId: number, code: string) {
    const user = await activeUser(userId)
    if (
        user.mfaMethod !== 'NONE' ||
        !user.mfaPendingTotpSecret ||
        !user.mfaPendingExpiresAt ||
        user.mfaPendingExpiresAt.getTime() <= Date.now()
    ) {
        throw mfaError('La configuración TOTP expiró. Comienza de nuevo.', 409)
    }
    const step = matchingTotpStep(decryptTotpSecret(user.mfaPendingTotpSecret), code)
    if (step === null) throw mfaError('El código TOTP es incorrecto', 401)
    const recoveryCodes = createRecoveryCodes()
    if (
        !(await repository.activateTotp(
            userId,
            user.mfaPendingTotpSecret,
            step,
            recoveryCodes.map(hashMfaValue),
        ))
    ) {
        throw mfaError('La configuración cambió. Comienza de nuevo.', 409)
    }
    return { recoveryCodes }
}

export async function startEmailSetup(userId: number, password: string) {
    const user = await checkPassword(userId, password)
    if (user.mfaMethod !== 'NONE') throw mfaError('Desactiva primero el método actual', 409)
    return issueChallenge(userId, 'ENABLE_EMAIL', true)
}

export async function confirmEmailSetup(userId: number, token: string, code: string) {
    const challenge = await verifyEmailChallenge(token, code, 'ENABLE_EMAIL', userId)
    if (!(await repository.activateEmail(userId, challenge.id))) {
        throw mfaError('La configuración cambió. Comienza de nuevo.', 409)
    }
}

export async function startEmailDisable(userId: number, password: string) {
    const user = await checkPassword(userId, password)
    if (user.mfaMethod !== 'EMAIL') throw mfaError('El correo no es el método activo', 409)
    return issueChallenge(userId, 'DISABLE_EMAIL', true)
}

export async function disableMfa(
    userId: number,
    input: { password?: string; code: string; challengeToken?: string },
) {
    const user = await activeUser(userId)
    if (user.mfaMethod === 'NONE') throw mfaError('No hay un método activo', 409)
    if (user.mfaMethod === 'TOTP') {
        if (!input.password) throw mfaError('Ingresa tu contraseña actual')
        await checkPassword(userId, input.password)
        const challenge = await issueChallenge(userId, 'DISABLE_TOTP', false)
        const proof = totpProof(user, input.code)
        if (!proof) throw mfaError('El código TOTP o de recuperación es incorrecto', 401)
        const stored = await validChallenge(challenge.challengeToken, 'DISABLE_TOTP', userId)
        if (
            !(await repository.disableMfa({
                userId,
                method: 'TOTP',
                challengeId: stored.id,
                ...proof,
            }))
        ) {
            throw mfaError('El código ya se utilizó o la configuración cambió', 409)
        }
        return
    }
    if (!input.challengeToken) throw mfaError('Solicita un código por correo primero')
    const challenge = await verifyEmailChallenge(
        input.challengeToken,
        input.code,
        'DISABLE_EMAIL',
        userId,
    )
    if (!(await repository.disableMfa({ userId, method: 'EMAIL', challengeId: challenge.id }))) {
        throw mfaError('El desafío ya no está disponible', 409)
    }
}

export async function beginLoginChallenge(userId: number, method: 'TOTP' | 'EMAIL') {
    const challenge = await issueChallenge(userId, 'LOGIN', method === 'EMAIL')
    return {
        mfaRequired: true as const,
        method,
        ...challenge,
    }
}

export async function verifyLoginChallenge(token: string, code: string) {
    const challenge = await validChallenge(token, 'LOGIN')
    const user = await activeUser(challenge.userId)
    if (user.mfaMethod === 'NONE') throw mfaError('El método de la cuenta cambió', 409)
    let proof: { step?: number; recoveryHash?: string } = {}
    if (user.mfaMethod === 'EMAIL') {
        await verifyEmailChallenge(token, code, 'LOGIN', user.id)
    } else {
        const result = totpProof(user, code)
        if (!result) {
            await repository.failChallengeAttempt(challenge.id)
            throw mfaError('El código TOTP o de recuperación es incorrecto', 401)
        }
        proof = result
    }
    if (
        !(await repository.consumeLoginChallenge({
            challengeId: challenge.id,
            userId: user.id,
            ...proof,
        }))
    ) {
        throw mfaError('El código ya se utilizó o el desafío expiró', 401)
    }
    const authUser = await findUserByIdWithAuthGraph(user.id)
    if (
        !authUser ||
        !authUser.isActive ||
        authUser.status !== 'ACTIVE' ||
        authUser.mfaMethod !== user.mfaMethod ||
        authUser.mfaVersion !== user.mfaVersion
    ) {
        throw mfaError('La cuenta no está habilitada', 403)
    }
    await recordUserAccess(user.id)
    return authUser
}
