import type { InternalAxiosRequestConfig } from 'axios'

export function applyDefaultHeadersInterceptor(config: InternalAxiosRequestConfig) {
    if (!config.headers.has('accept')) {
        config.headers.set('accept', 'application/json')
    }

    const method = config.method?.toLowerCase()
    const shouldSetJsonContentType =
        method !== 'get' && method !== 'head' && !config.headers.has('content-type')

    if (shouldSetJsonContentType) {
        config.headers.set('content-type', 'application/json')
    }

    return config
}
