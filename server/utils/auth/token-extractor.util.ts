import { getCookie, getHeader, type H3Event } from 'h3'
import { createError } from 'h3'
import { ApiErrorCode } from '../../types/api-response.types'
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '../../constants/auth.constants'

const BEARER_PREFIX = 'Bearer '

export function extractAccessToken(event: H3Event) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader?.startsWith(BEARER_PREFIX)) {
        return authHeader.slice(BEARER_PREFIX.length).trim()
    }

    const cookieToken = getCookie(event, ACCESS_TOKEN_COOKIE_NAME)
    if (cookieToken) {
        return cookieToken
    }

    throw createError({
        statusCode: 401,
        statusMessage: 'No autenticado',
        data: { code: ApiErrorCode.UNAUTHORIZED },
    })
}

export function extractRefreshToken(event: H3Event, bodyToken?: string) {
    if (bodyToken) {
        return bodyToken
    }

    const cookieToken = getCookie(event, REFRESH_TOKEN_COOKIE_NAME)
    if (cookieToken) {
        return cookieToken
    }

    throw createError({
        statusCode: 401,
        statusMessage: 'Refresh token requerido',
        data: { code: ApiErrorCode.UNAUTHORIZED },
    })
}
