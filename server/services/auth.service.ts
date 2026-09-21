import { createError } from 'h3'
import { randomUUID } from 'node:crypto'
import type { AuthResponseDto, AuthUserDto } from '../dto/auth/auth-response.dto'
import { ApiErrorCode } from '../types/api-response.types'
import { REFRESH_TOKEN_TTL_SECONDS } from '../constants/auth.constants'
import {
    createAuthSession,
    createPasswordResetToken,
    deleteExpiredOrRevokedAuthSessions,
    findAuthSessionByTokenId,
    findPasswordResetTokenByHash,
    findUserByEmailWithAuthGraph,
    findUserByEmailForPasswordReset,
    findUserByIdWithAuthGraph,
    consumePasswordResetToken,
    revokeAuthSessionById,
    revokePasswordResetTokenById,
} from '../repositories/auth.repository'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/auth/jwt.util'
import { hashPassword, verifyPassword } from '../utils/auth/password.util'
import {
    changeUserPasswordRecord,
    consumeInvitation,
    findInvitationByTokenHash,
    recordUserAccess,
} from '../repositories/user.repository'
import { hashInvitationToken } from '../utils/auth/invitation-token.util'
import {
    generatePasswordResetToken,
    hashPasswordResetToken,
} from '../utils/auth/password-reset-token.util'
import { validateEnv } from '../../config/env'
import { sendPasswordResetEmail } from './email.service'
import { beginLoginChallenge, verifyLoginChallenge } from './mfa.service'

interface AuthTokensResult extends AuthResponseDto {
    refreshToken: string
}

function invalidCredentialsError() {
    return createError({
        statusCode: 401,
        message: 'Credenciales inválidas',
        data: { code: ApiErrorCode.INVALID_CREDENTIALS },
    })
}

function invalidRefreshTokenError() {
    return createError({
        statusCode: 401,
        message: 'Refresh token inválido',
        data: { code: ApiErrorCode.INVALID_TOKEN },
    })
}

function inactiveUserError() {
    return createError({
        statusCode: 403,
        message: 'Usuario inactivo',
        data: { code: ApiErrorCode.FORBIDDEN },
    })
}

function invalidPasswordResetTokenError() {
    return createError({
        statusCode: 401,
        message: 'El enlace de recuperación no es válido o ya expiró',
        data: { code: ApiErrorCode.INVALID_TOKEN },
    })
}

function mailDeliveryError() {
    return createError({
        statusCode: 502,
        message: 'No fue posible entregar el enlace de recuperación por correo',
        data: { code: ApiErrorCode.SERVICE_UNAVAILABLE },
    })
}

function resolveUserDisplayName(
    user: NonNullable<Awaited<ReturnType<typeof findUserByEmailForPasswordReset>>>,
) {
    const member = user.member
    if (!member) return user.username ?? user.email

    const fullName = [member.firstName, member.middleName, member.lastName, member.secondLastName]
        .filter(Boolean)
        .join(' ')

    return member.preferredName?.trim() || fullName || user.username || user.email
}

function mapUserAuth(user: NonNullable<Awaited<ReturnType<typeof findUserByEmailWithAuthGraph>>>) {
    const permissionMap = new Map<string, AuthUserDto['permissions'][number]>()

    const roles = user.userRoles
        .filter(({ role }) => role.status === 'ACTIVE')
        .map(({ role }) => {
            const rolePermissions = role.rolePermissions
                .filter(({ permission }) => permission.status === 'ACTIVE')
                .map(({ permission }) => {
                    const mapped = {
                        id: permission.id,
                        name: permission.name,
                        code: permission.code,
                        resource: permission.resource,
                        action: permission.action,
                        description: permission.description,
                    }
                    permissionMap.set(permission.code, mapped)
                    return mapped
                })

            return {
                id: role.id,
                name: role.name,
                code: role.code,
                description: role.description,
                permissions: rolePermissions,
            }
        })

    return {
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            mustChangePassword: user.mustChangePassword,
            mfaMethod: user.mfaMethod,
            roles,
            permissions: [...permissionMap.values()],
        } as AuthUserDto,
        roleCodes: roles.map((role) => role.code),
        permissionCodes: [...permissionMap.keys()],
    }
}

function buildRefreshTokenExpiresAt() {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)
}

function parseTokenUserId(value: string) {
    const userId = Number(value)
    if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw invalidRefreshTokenError()
    }
    return userId
}

async function issueTokensAndSession(
    user: NonNullable<Awaited<ReturnType<typeof findUserByEmailWithAuthGraph>>>,
): Promise<AuthTokensResult> {
    const { user: userResponse, roleCodes, permissionCodes } = mapUserAuth(user)
    const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        roles: roleCodes,
        permissions: permissionCodes,
        mustChangePassword: user.mustChangePassword,
        mfaVersion: user.mfaVersion,
    })

    const sessionTokenId = randomUUID()
    const refreshToken = signRefreshToken({
        userId: user.id,
        sessionId: sessionTokenId,
    })
    const refreshTokenHash = await hashPassword(refreshToken.token)

    await createAuthSession({
        tokenId: sessionTokenId,
        userId: user.id,
        refreshTokenHash,
        expiresAt: buildRefreshTokenExpiresAt(),
    })

    // Keep session table small and avoid stale rows accumulation.
    await deleteExpiredOrRevokedAuthSessions(user.id)

    return {
        user: userResponse,
        tokens: {
            tokenType: 'Bearer',
            accessToken: accessToken.token,
            accessTokenExpiresIn: accessToken.expiresIn,
            refreshTokenExpiresIn: refreshToken.expiresIn,
        },
        refreshToken: refreshToken.token,
    }
}

export async function login(dto: { email: string; password: string; invitationToken?: string }) {
    let user = await findUserByEmailWithAuthGraph(dto.email)
    if (!user) {
        throw invalidCredentialsError()
    }

    const isPasswordValid = await verifyPassword(dto.password, user.passwordHash)
    if (!isPasswordValid) {
        throw invalidCredentialsError()
    }

    if (!user.isActive || user.status === 'BLOCKED') {
        throw inactiveUserError()
    }

    if (user.status === 'INVITED') {
        if (!dto.invitationToken) {
            throw createError({
                statusCode: 401,
                message: 'Abre el enlace de invitación enviado a tu correo',
                data: { code: ApiErrorCode.INVALID_TOKEN },
            })
        }
        const invitation = await findInvitationByTokenHash(hashInvitationToken(dto.invitationToken))
        if (
            !invitation ||
            invitation.userId !== user.id ||
            invitation.usedAt ||
            invitation.revokedAt
        ) {
            throw createError({
                statusCode: 401,
                message: 'La invitación no es válida o ya fue utilizada',
                data: { code: ApiErrorCode.INVALID_TOKEN },
            })
        }
        if (invitation.expiresAt.getTime() <= Date.now()) {
            throw createError({
                statusCode: 401,
                message: 'La invitación ha expirado',
                data: { code: ApiErrorCode.TOKEN_EXPIRED },
            })
        }
        if (!(await consumeInvitation(invitation.id, user.id))) {
            throw createError({
                statusCode: 401,
                message: 'La invitación ya no está disponible',
                data: { code: ApiErrorCode.INVALID_TOKEN },
            })
        }
        user = await findUserByEmailWithAuthGraph(dto.email)
        if (!user) throw invalidCredentialsError()
    }

    if (user.mfaMethod !== 'NONE') {
        return beginLoginChallenge(user.id, user.mfaMethod)
    }
    await recordUserAccess(user.id)

    return issueTokensAndSession(user)
}

export async function completeMfaLogin(token: string, code: string) {
    const user = await verifyLoginChallenge(token, code)
    return issueTokensAndSession(user)
}

export async function changePassword(
    userId: number,
    dto: { currentPassword: string; newPassword: string },
) {
    const user = await findUserByIdWithAuthGraph(userId)
    if (!user) throw invalidCredentialsError()
    if (!(await verifyPassword(dto.currentPassword, user.passwordHash))) {
        throw invalidCredentialsError()
    }
    if (await verifyPassword(dto.newPassword, user.passwordHash)) {
        throw createError({
            statusCode: 400,
            message: 'La contraseña nueva debe ser diferente de la temporal',
            data: {
                code: ApiErrorCode.VALIDATION_ERROR,
                fields: { newPassword: ['Utiliza una contraseña diferente.'] },
            },
        })
    }

    await changeUserPasswordRecord(userId, await hashPassword(dto.newPassword))
    const updatedUser = await findUserByIdWithAuthGraph(userId)
    if (!updatedUser) throw invalidCredentialsError()
    return issueTokensAndSession(updatedUser)
}

export async function requestPasswordReset(dto: { email: string }) {
    const user = await findUserByEmailForPasswordReset(dto.email)
    if (!user || !user.isActive || user.status !== 'ACTIVE') {
        return
    }

    const env = validateEnv()
    const resetToken = generatePasswordResetToken()
    const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000)

    const passwordReset = await createPasswordResetToken({
        userId: user.id,
        tokenHash: hashPasswordResetToken(resetToken),
        expiresAt,
    })

    try {
        await sendPasswordResetEmail({
            email: user.email,
            displayName: resolveUserDisplayName(user),
            resetToken,
            expiresAt,
        })
    } catch {
        await revokePasswordResetTokenById(passwordReset.id)
        throw mailDeliveryError()
    }
}

export async function validatePasswordResetToken(resetToken: string) {
    const passwordReset = await findPasswordResetTokenByHash(hashPasswordResetToken(resetToken))
    if (
        !passwordReset ||
        passwordReset.usedAt ||
        passwordReset.revokedAt ||
        passwordReset.expiresAt.getTime() <= Date.now() ||
        !passwordReset.user.isActive ||
        passwordReset.user.status !== 'ACTIVE'
    ) {
        throw invalidPasswordResetTokenError()
    }

    return {
        email: passwordReset.user.email,
        displayName: resolveUserDisplayName(passwordReset.user),
        expiresAt: passwordReset.expiresAt.toISOString(),
    }
}

export async function resetPasswordWithToken(dto: { resetToken: string; newPassword: string }) {
    const passwordReset = await findPasswordResetTokenByHash(hashPasswordResetToken(dto.resetToken))
    if (
        !passwordReset ||
        passwordReset.usedAt ||
        passwordReset.revokedAt ||
        passwordReset.expiresAt.getTime() <= Date.now() ||
        !passwordReset.user.isActive ||
        passwordReset.user.status !== 'ACTIVE'
    ) {
        throw invalidPasswordResetTokenError()
    }

    if (await verifyPassword(dto.newPassword, passwordReset.user.passwordHash)) {
        throw createError({
            statusCode: 400,
            message: 'La contraseña nueva debe ser diferente de la actual',
            data: {
                code: ApiErrorCode.VALIDATION_ERROR,
                fields: { newPassword: ['Utiliza una contraseña diferente.'] },
            },
        })
    }

    const consumed = await consumePasswordResetToken(
        passwordReset.id,
        passwordReset.userId,
        await hashPassword(dto.newPassword),
    )
    if (!consumed) throw invalidPasswordResetTokenError()
}

export async function getCurrentUser(userId: number) {
    const user = await findUserByIdWithAuthGraph(userId)
    if (!user) {
        throw invalidCredentialsError()
    }
    if (!user.isActive || user.status === 'BLOCKED') {
        throw inactiveUserError()
    }

    return mapUserAuth(user).user
}

export async function refreshAuth(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken)
    const userId = parseTokenUserId(payload.sub)

    const session = await findAuthSessionByTokenId(payload.sid)
    if (!session || session.userId !== userId) {
        throw invalidRefreshTokenError()
    }

    if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
        throw invalidRefreshTokenError()
    }

    const isRefreshTokenValid = await verifyPassword(refreshToken, session.refreshTokenHash)
    if (!isRefreshTokenValid) {
        throw invalidRefreshTokenError()
    }

    const user = await findUserByIdWithAuthGraph(userId)
    if (!user) {
        throw invalidRefreshTokenError()
    }

    if (!user.isActive || user.status === 'BLOCKED') {
        throw inactiveUserError()
    }

    await revokeAuthSessionById(session.id)

    return issueTokensAndSession(user)
}

export async function logout(refreshToken: string) {
    try {
        const payload = verifyRefreshToken(refreshToken)
        const session = await findAuthSessionByTokenId(payload.sid)
        if (session && !session.revokedAt) {
            await revokeAuthSessionById(session.id)
        }
    } catch {
        // Logout is idempotent. Invalid/expired token still clears cookies.
    }
}
