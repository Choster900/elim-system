import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { loginRequest, verifyMfaLoginRequest } from '../services/auth.service'
import type { LoginRequest } from '../interfaces/login-request.interface'

export function useLoginMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: LoginRequest) => loginRequest(apiClient, payload),
        onSuccess: () => queryClient.clear(),
    })
}

export function useVerifyMfaLoginMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: { challengeToken: string; code: string }) =>
            verifyMfaLoginRequest(apiClient, payload),
        onSuccess: () => queryClient.clear(),
    })
}
