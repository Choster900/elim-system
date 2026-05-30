import type { InternalAxiosRequestConfig } from 'axios'
import { AUTHORIZATION_HEADER, BEARER_PREFIX } from '~/constants/http/http.constants'

interface AuthTokenInterceptorOptions {
    getAuthToken?: () => string | null | undefined
}

export function createAuthTokenInterceptor(options: AuthTokenInterceptorOptions) {
    return (config: InternalAxiosRequestConfig) => {
        const token = options.getAuthToken?.()

        if (token && !config.headers.has(AUTHORIZATION_HEADER)) {
            config.headers.set(AUTHORIZATION_HEADER, `${BEARER_PREFIX} ${token}`)
        }

        return config
    }
}
