import { useMutation } from '@tanstack/vue-query'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { loginRequest } from '../services/auth.service'
import type { LoginRequest } from '../interfaces/login-request.interface'

export function useLoginMutation() {
    const apiClient = useApiClient()

    return useMutation({
        mutationFn: (payload: LoginRequest) => loginRequest(apiClient, payload),
    })
}
