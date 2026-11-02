import { handleCors, isPreflightRequest, setResponseHeader } from 'h3'
import { parseCorsOrigins, validateEnv } from '../../config/env'

const CORS_PREFLIGHT_MAX_AGE_SECONDS = 600

export default defineEventHandler((event) => {
    if (!event.path.startsWith('/api')) {
        return
    }

    const origins = parseCorsOrigins(validateEnv().CORS_ALLOWED_ORIGINS)
    if (origins.length === 0) {
        return
    }

    if (isPreflightRequest(event)) {
        setResponseHeader(event, 'Access-Control-Max-Age', CORS_PREFLIGHT_MAX_AGE_SECONDS)
    }

    handleCors(event, {
        origin: origins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Request-Id'],
        credentials: true,
        preflight: { statusCode: 204 },
    })
})
