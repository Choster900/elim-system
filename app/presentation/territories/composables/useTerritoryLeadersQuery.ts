import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getTerritoryLeaders } from '../services/territory.service'

const CATALOG_STALE_TIME_MS = 5 * 60_000

export function useTerritoryLeadersQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.territories.leaders,
        queryFn: ({ signal }) => getTerritoryLeaders(apiClient, signal),
        staleTime: CATALOG_STALE_TIME_MS,
    })
}
