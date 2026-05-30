import { useNuxtApp } from '#imports'

export function useAppToast() {
    return useNuxtApp().$appToast
}
