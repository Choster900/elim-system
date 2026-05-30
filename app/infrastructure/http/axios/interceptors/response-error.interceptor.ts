import type { AxiosError } from 'axios'
import type { HttpClientError } from '~/presentation/shared/interfaces/http/http-client-error.interface'

export function createResponseErrorInterceptor(isDev: boolean) {
    return (error: AxiosError) => {
        const normalizedError: HttpClientError = {
            name: 'HttpClientError',
            message: error.response?.statusText || error.message || 'Unexpected HTTP error',
            status: error.response?.status ?? null,
            code: error.code ?? null,
            details: error.response?.data,
            endpoint: error.config?.url,
        }

        return Promise.reject(normalizedError)
    }
}
