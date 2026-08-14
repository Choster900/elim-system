import { createError, getRouterParam } from 'h3'
import type { H3Event } from 'h3'
import { ApiErrorCode } from '../../types/api-response.types'

export function getPositiveIntegerParam(event: H3Event, name: string) {
    const rawValue = getRouterParam(event, name)
    const value = Number(rawValue)

    if (!Number.isSafeInteger(value) || value <= 0) {
        throw createError({
            statusCode: 400,
            message: `El parámetro ${name} debe ser un entero positivo`,
            data: { code: ApiErrorCode.VALIDATION_ERROR },
        })
    }

    return value
}
