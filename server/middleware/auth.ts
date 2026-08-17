import { extractAccessToken } from '../utils/auth/token-extractor.util'
import { verifyAccessToken } from '../utils/auth/jwt.util'

const PUBLIC_API_PATHS = new Set([
    '/api/healthcheck',
    '/api/openapi.json',
    '/api/docs',
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/auth/invitations/validate',
])

const PASSWORD_CHANGE_ALLOWED_PATHS = new Set(['/api/auth/me', '/api/auth/change-password'])

function isPublicApiPath(path: string) {
    if (PUBLIC_API_PATHS.has(path)) {
        return true
    }

    return path.startsWith('/api/docs/')
}

export default defineEventHandler((event) => {
    if (!event.path.startsWith('/api')) {
        return
    }

    if (isPublicApiPath(event.path)) {
        return
    }

    if (event.node.req.method === 'OPTIONS') {
        return
    }

    const token = extractAccessToken(event)
    const payload = verifyAccessToken(token)
    const userId = Number(payload.sub)

    if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw createError({ statusCode: 401, message: 'Token inválido' })
    }

    event.context.auth = {
        userId,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions,
        mustChangePassword: payload.mustChangePassword,
        tokenExpiresAt: payload.exp ?? null,
    }

    if (payload.mustChangePassword && !PASSWORD_CHANGE_ALLOWED_PATHS.has(event.path)) {
        throw createError({
            statusCode: 403,
            message: 'Debes cambiar tu contraseña antes de continuar',
            data: { code: 'PASSWORD_CHANGE_REQUIRED' },
        })
    }
})
