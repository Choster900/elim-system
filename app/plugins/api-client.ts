import { createAxiosClient, buildApiBaseUrl, HTTP_TIMEOUT_MS } from '~/infrastructure/http/axios'

export default defineNuxtPlugin(() => {
    const runtimeConfig = useRuntimeConfig()
    const accessToken = useCookie<string | null>('access_token')
    const requestUrl = import.meta.server ? useRequestURL() : null

    const apiClient = createAxiosClient({
        baseURL: buildApiBaseUrl({
            requestOrigin: requestUrl?.origin,
        }),
        timeout: HTTP_TIMEOUT_MS,
        isDev: import.meta.dev,
        getAuthToken: () => accessToken.value,
    })

    return {
        provide: {
            apiClient,
        },
    }
})
