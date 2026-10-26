import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getTithers, getTithes } from '../services/tithe.service'

export function useTithesQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.tithes.list,
        queryFn: ({ signal }) => getTithes(apiClient, signal),
        refetchOnWindowFocus: true,
    })
}

export function useTithersQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.tithes.tithers,
        queryFn: ({ signal }) => getTithers(apiClient, signal),
        staleTime: 5 * 60_000,
    })
}
