import { useQuery } from '@tanstack/vue-query'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { queryKeys } from '~/constants/query-keys'
import { getHealthcheck } from '../services/healthcheck.service'

interface UseHealthcheckQueryOptions {
    enabled?: boolean
}

export function useHealthcheckQuery(options: UseHealthcheckQueryOptions = {}) {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.system.healthcheck,
        queryFn: () => getHealthcheck(apiClient),
        enabled: options.enabled ?? true,
    })
}
