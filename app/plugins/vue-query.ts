import {
    QueryClient,
    VueQueryPlugin,
    dehydrate,
    hydrate,
    type DehydratedState,
    type VueQueryPluginOptions,
} from '@tanstack/vue-query'
import { useState } from '#imports'
import type { HttpClientError } from '~/presentation/shared/interfaces/http/http-client-error.interface'

const DEFAULT_STALE_TIME_MS = 30_000
const DEFAULT_GC_TIME_MS = 5 * 60_000

function shouldRetry(failureCount: number, error: Error) {
    const status = (error as HttpClientError).status
    if (status !== null && status >= 400 && status < 500) return false
    return failureCount < 1
}

export default defineNuxtPlugin((nuxtApp) => {
    const vueQueryState = useState<DehydratedState | null>('vue-query', () => null)

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: shouldRetry,
                staleTime: DEFAULT_STALE_TIME_MS,
                gcTime: DEFAULT_GC_TIME_MS,
                refetchOnWindowFocus: false,
            },
            mutations: {
                retry: false,
            },
        },
    })

    const options: VueQueryPluginOptions = { queryClient }
    nuxtApp.vueApp.use(VueQueryPlugin, options)

    if (import.meta.server) {
        nuxtApp.hooks.hook('app:rendered', () => {
            vueQueryState.value = dehydrate(queryClient)
        })
    }

    if (import.meta.client && vueQueryState.value) hydrate(queryClient, vueQueryState.value)

    return {
        provide: {
            queryClient,
        },
    }
})
