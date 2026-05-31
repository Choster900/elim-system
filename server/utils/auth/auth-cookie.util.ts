import { setCookie, deleteCookie, type H3Event } from 'h3'
import {
    ACCESS_TOKEN_COOKIE_NAME,
    ACCESS_TOKEN_TTL_SECONDS,
    REFRESH_TOKEN_COOKIE_NAME,
    REFRESH_TOKEN_TTL_SECONDS,
} from '../../constants/auth.constants'

function buildCookieOptions(maxAge: number) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
        maxAge,
    }
}

export function setAccessTokenCookie(event: H3Event, token: string) {
    setCookie(event, ACCESS_TOKEN_COOKIE_NAME, token, buildCookieOptions(ACCESS_TOKEN_TTL_SECONDS))
}

export function setRefreshTokenCookie(event: H3Event, token: string) {
    setCookie(event, REFRESH_TOKEN_COOKIE_NAME, token, buildCookieOptions(REFRESH_TOKEN_TTL_SECONDS))
}

export function clearAuthCookies(event: H3Event) {
    deleteCookie(event, ACCESS_TOKEN_COOKIE_NAME, { path: '/' })
    deleteCookie(event, REFRESH_TOKEN_COOKIE_NAME, { path: '/' })
}
