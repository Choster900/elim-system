import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { logoutRequest } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

export function useLogoutMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    const authStore = useAuthStore()

    return useMutation({
        mutationFn: () => logoutRequest(apiClient),
        onSettled: () => {
            queryClient.clear()
            authStore.clearUser()
        },
    })
}
