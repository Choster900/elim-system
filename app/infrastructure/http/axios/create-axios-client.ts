import axios from 'axios'
import { HTTP_TIMEOUT_MS } from '~/constants/http/http.constants'
import type { HttpClientContext } from '~/presentation/shared/interfaces/http/http-client-context.interface'
import { registerAxiosInterceptors } from './interceptors/register-axios-interceptors'

export function createAxiosClient(context: HttpClientContext) {
    const client = axios.create({
        baseURL: context.baseURL,
        timeout: context.timeout || HTTP_TIMEOUT_MS,
    })

    registerAxiosInterceptors(client, context)
    return client
}
