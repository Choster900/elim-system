import type { InternalAxiosRequestConfig } from 'axios'
import { REQUEST_ID_HEADER } from '~/constants/http/http.constants'
import { createRequestId } from '~/utils/http/create-request-id.util'

export function applyRequestIdInterceptor(config: InternalAxiosRequestConfig) {
    if (!config.headers.has(REQUEST_ID_HEADER)) {
        config.headers.set(REQUEST_ID_HEADER, createRequestId())
    }

    return config
}
