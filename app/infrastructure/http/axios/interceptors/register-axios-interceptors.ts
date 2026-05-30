import type { AxiosInstance } from 'axios'
import type { HttpClientContext } from '~/presentation/shared/interfaces/http/http-client-context.interface'
import { createAuthTokenInterceptor } from './auth-token.interceptor'
import { applyDefaultHeadersInterceptor } from './default-headers.interceptor'
import { applyRequestIdInterceptor } from './request-id.interceptor'
import { createResponseErrorInterceptor } from './response-error.interceptor'

export function registerAxiosInterceptors(client: AxiosInstance, context: HttpClientContext) {
    client.interceptors.request.use(applyRequestIdInterceptor)
    client.interceptors.request.use(applyDefaultHeadersInterceptor)
    client.interceptors.request.use(createAuthTokenInterceptor(context))
    client.interceptors.response.use(undefined, createResponseErrorInterceptor(context.isDev))
}
