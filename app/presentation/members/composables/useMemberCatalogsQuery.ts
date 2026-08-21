import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getMemberCatalogs } from '../services/member.service'

export function useMemberCatalogsQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.members.catalogs,
        queryFn: ({ signal }) => getMemberCatalogs(apiClient, signal),
        staleTime: 5 * 60 * 1000,
    })
}
