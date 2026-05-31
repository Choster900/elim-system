import jwt from 'jsonwebtoken'
import { createError } from 'h3'
import { ApiErrorCode } from '../../types/api-response.types'
import type { AccessTokenPayload, RefreshTokenPayload } from '../../types/auth.types'
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from '../../constants/auth.constants'

const JWT_ALGORITHM = 'HS256'

interface SignAccessTokenInput {
    userId: string
    email: string
    roles: string[]
    permissions: string[]
}

interface SignRefreshTokenInput {
    userId: string
    sessionId: string
}

function getJwtSecret() {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw createError({
            statusCode: 500,
            statusMessage: 'JWT secret is not configured',
            data: { code: ApiErrorCode.INTERNAL_SERVER_ERROR },
        })
    }
    return secret
}

function buildTokenError(error: unknown) {
    const isExpired = error instanceof jwt.TokenExpiredError

    return createError({
        statusCode: 401,
        statusMessage: isExpired ? 'Token expirado' : 'Token inválido',
        data: {
            code: isExpired ? ApiErrorCode.TOKEN_EXPIRED : ApiErrorCode.INVALID_TOKEN,
        },
    })
}

export function signAccessToken(input: SignAccessTokenInput) {
    const payload: AccessTokenPayload = {
        sub: input.userId,
        email: input.email,
        roles: input.roles,
        permissions: input.permissions,
        type: 'access',
    }

    const token = jwt.sign(payload, getJwtSecret(), {
        algorithm: JWT_ALGORITHM,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    })

    return { token, expiresIn: ACCESS_TOKEN_TTL_SECONDS }
}

export function signRefreshToken(input: SignRefreshTokenInput) {
    const payload: RefreshTokenPayload = {
        sub: input.userId,
        sid: input.sessionId,
        type: 'refresh',
    }

    const token = jwt.sign(payload, getJwtSecret(), {
        algorithm: JWT_ALGORITHM,
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    })

    return { token, expiresIn: REFRESH_TOKEN_TTL_SECONDS }
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    try {
        const decoded = jwt.verify(token, getJwtSecret(), {
            algorithms: [JWT_ALGORITHM],
        })

        if (
            !decoded ||
            typeof decoded !== 'object' ||
            decoded.type !== 'access' ||
            typeof decoded.sub !== 'string' ||
            typeof decoded.email !== 'string'
        ) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Token inválido',
                data: { code: ApiErrorCode.INVALID_TOKEN },
            })
        }

        return decoded as AccessTokenPayload
    } catch (error) {
        if ((error as { statusCode?: number })?.statusCode === 401) {
            throw error
        }
        throw buildTokenError(error)
    }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
        const decoded = jwt.verify(token, getJwtSecret(), {
            algorithms: [JWT_ALGORITHM],
        })

        if (
            !decoded ||
            typeof decoded !== 'object' ||
            decoded.type !== 'refresh' ||
            typeof decoded.sub !== 'string' ||
            typeof decoded.sid !== 'string'
        ) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Token inválido',
                data: { code: ApiErrorCode.INVALID_TOKEN },
            })
        }

        return decoded as RefreshTokenPayload
    } catch (error) {
        if ((error as { statusCode?: number })?.statusCode === 401) {
            throw error
        }
        throw buildTokenError(error)
    }
}
