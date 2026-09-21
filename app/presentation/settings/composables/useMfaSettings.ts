import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getMfaStatus } from '../services/mfa.service'

export function useMfaSettingsQuery() {
    const apiClient = useApiClient()
    return useQuery({
        queryKey: queryKeys.settings.mfa,
        queryFn: ({ signal }) => getMfaStatus(apiClient, signal),
    })
}
