import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { validateInvitationRequest } from '../services/auth.service'

export function useInvitationQuery(invitationToken: Ref<string>) {
    const apiClient = useApiClient()
    return useQuery({
        queryKey: computed(() => queryKeys.auth.invitation(invitationToken.value)),
        queryFn: ({ signal }) =>
            validateInvitationRequest(apiClient, invitationToken.value, signal),
        enabled: computed(() => invitationToken.value.length >= 32),
        retry: false,
        staleTime: 30_000,
    })
}
