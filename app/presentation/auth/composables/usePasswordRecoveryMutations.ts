import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type {
    RequestPasswordResetPayload,
    ResetPasswordPayload,
} from '../interfaces/login-response.interface'
import { requestPasswordResetRequest, resetPasswordRequest } from '../services/auth.service'

export function useRequestPasswordResetMutation() {
    const apiClient = useApiClient()

    return useMutation({
        mutationFn: (payload: RequestPasswordResetPayload) =>
            requestPasswordResetRequest(apiClient, payload),
    })
}

export function useResetPasswordMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: ResetPasswordPayload) => resetPasswordRequest(apiClient, payload),
        onSuccess: () => queryClient.clear(),
    })
}
