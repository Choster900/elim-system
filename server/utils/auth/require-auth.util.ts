import { createError, type H3Event } from 'h3'
import { ApiErrorCode } from '../../types/api-response.types'

export function requireAuth(event: H3Event) {
    if (!event.context.auth) {
        throw createError({
            statusCode: 401,
            statusMessage: 'No autenticado',
            data: { code: ApiErrorCode.UNAUTHORIZED },
        })
    }

    return event.context.auth
}
