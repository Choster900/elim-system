import { createError } from 'h3'
import { randomUUID } from 'node:crypto'
import type { AuthResponseDto, AuthUserDto } from '../dto/auth/auth-response.dto'
import { ApiErrorCode } from '../types/api-response.types'
import { REFRESH_TOKEN_TTL_SECONDS } from '../constants/auth.constants'
import {
    createAuthSession,
    deleteExpiredOrRevokedAuthSessions,
    findAuthSessionByTokenId,
    findUserByEmailWithAuthGraph,
    findUserByIdWithAuthGraph,
    revokeAuthSessionById,
} from '../repositories/auth.repository'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/auth/jwt.util'
import { hashPassword, verifyPassword } from '../utils/auth/password.util'

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

export async function login(dto: { email: string; password: string }) {
    const user = await findUserByEmailWithAuthGraph(dto.email)
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

    return issueTokensAndSession(user)
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
