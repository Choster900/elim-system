import { useNuxtApp } from '#imports'

export function useApiClient() {
    return useNuxtApp().$apiClient
}
