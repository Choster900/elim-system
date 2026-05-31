import { setResponseStatus } from 'h3'
import type { H3Event } from 'h3'
import { ApiErrorCode } from '../types/api-response.types'
import { ApiResponseFactory } from './response.util'

interface H3ErrorLike {
    statusCode?: number
    statusMessage?: string
    data?: {
        code?: string
        fields?: Record<string, string[]>
    }
    message?: string
}

function isH3Error(error: unknown): error is H3ErrorLike {
    return typeof error === 'object' && error !== null && 'statusCode' in error
}

const STATUS_CODE_MAP: Record<number, { code: ApiErrorCode; message: string }> = {
    400: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Los datos enviados no son válidos',
    },
    401: {
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'No autenticado',
    },
    403: {
        code: ApiErrorCode.FORBIDDEN,
        message: 'No tiene permisos para realizar esta acción',
    },
    404: {
        code: ApiErrorCode.RESOURCE_NOT_FOUND,
        message: 'Recurso no encontrado',
    },
    409: {
        code: ApiErrorCode.RESOURCE_ALREADY_EXISTS,
        message: 'No se pudo completar la operación',
    },
}

export function handleApiError(event: H3Event, error: unknown) {
    const h3Error = isH3Error(error) ? error : null
    const statusCode = h3Error?.statusCode ?? 500
    const isServerError = statusCode >= 500
    const isDev = process.env.NODE_ENV !== 'production'

    const mapped = STATUS_CODE_MAP[statusCode]
    const code = h3Error?.data?.code ?? mapped?.code ?? ApiErrorCode.INTERNAL_SERVER_ERROR
    const message = mapped?.message ?? 'Ocurrió un error interno en el servidor'

    const details = isServerError
        ? isDev && h3Error?.message
            ? h3Error.message
            : 'Contacte al administrador si el problema persiste'
        : (h3Error?.statusMessage ?? null)

    setResponseStatus(event, statusCode)

    return ApiResponseFactory.error(message, code, {
        details,
        fields: h3Error?.data?.fields ?? null,
        meta: { path: event.path },
    })
}
