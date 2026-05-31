import { extractAccessToken } from '../utils/auth/token-extractor.util'
import { verifyAccessToken } from '../utils/auth/jwt.util'

const PUBLIC_API_PATHS = new Set([
    '/api/healthcheck',
    '/api/openapi.json',
    '/api/docs',
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout',
])

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

    event.context.auth = {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions,
        tokenExpiresAt: payload.exp ?? null,
    }
})
