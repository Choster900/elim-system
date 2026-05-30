import type { QueryClient } from '@tanstack/vue-query'
import type { AxiosInstance } from 'axios'
import type { AppToast } from '~/infrastructure/notifications'

declare module '#app' {
    interface NuxtApp {
        $queryClient: QueryClient
        $apiClient: AxiosInstance
        $appToast: AppToast
    }
}

declare module 'vue' {
    interface ComponentCustomProperties {
        $queryClient: QueryClient
        $apiClient: AxiosInstance
        $appToast: AppToast
    }
}

export {}
