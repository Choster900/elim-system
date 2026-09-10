import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { validatePasswordResetRequest } from '../services/auth.service'

export function usePasswordResetQuery(resetToken: Ref<string>) {
    const apiClient = useApiClient()
    return useQuery({
        queryKey: computed(() => queryKeys.auth.passwordReset(resetToken.value)),
        queryFn: ({ signal }) => validatePasswordResetRequest(apiClient, resetToken.value, signal),
        enabled: computed(() => resetToken.value.length >= 32),
        retry: false,
        staleTime: 30_000,
    })
}
