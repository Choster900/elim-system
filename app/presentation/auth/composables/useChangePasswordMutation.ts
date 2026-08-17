import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { ChangePasswordRequest } from '../interfaces/login-response.interface'
import { changePasswordRequest } from '../services/auth.service'

export function useChangePasswordMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: ChangePasswordRequest) => changePasswordRequest(apiClient, payload),
        onSuccess: () => queryClient.clear(),
    })
}
