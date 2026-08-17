import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getMembers } from '../services/member.service'

export function useMembersQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.members.list,
        queryFn: ({ signal }) => getMembers(apiClient, signal),
    })
}
