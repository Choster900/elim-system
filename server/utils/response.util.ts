import type { ApiResponse, ApiMeta } from '../types/api-response.types'

export class ApiResponseFactory {
    static success<T>(
        data: T | null,
        message = 'Operación realizada correctamente',
        meta: Omit<ApiMeta, 'timestamp'> | null = null,
    ): ApiResponse<T> {
        return {
            success: true,
            message,
            data,
            error: null,
            meta: {
                timestamp: new Date().toISOString(),
                ...meta,
            },
        }
    }

    static error(
        message: string,
        code: string,
        options: {
            details?: string | null
            fields?: Record<string, string[]> | null
            meta?: Omit<ApiMeta, 'timestamp'> | null
        } = {},
    ): ApiResponse<null> {
        return {
            success: false,
            message,
            data: null,
            error: {
                code,
                details: options.details ?? null,
                fields: options.fields ?? null,
            },
            meta: {
                timestamp: new Date().toISOString(),
                ...options.meta,
            },
        }
    }
}
