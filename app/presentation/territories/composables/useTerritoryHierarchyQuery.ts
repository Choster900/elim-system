import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getTerritoryHierarchy } from '../services/territory.service'

export function useTerritoryHierarchyQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.territories.hierarchy,
        queryFn: ({ signal }) => getTerritoryHierarchy(apiClient, signal),
    })
}
