import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getTerritorySupervisors } from '../services/territory.service'

export function useTerritorySupervisorsQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.territories.supervisors,
        queryFn: ({ signal }) => getTerritorySupervisors(apiClient, signal),
    })
}
