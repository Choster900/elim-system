import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getUserCatalog, getUsers } from '../services/user.service'

export function useUsersQuery() {
    const apiClient = useApiClient()
    return useQuery({
        queryKey: queryKeys.users.list,
        queryFn: ({ signal }) => getUsers(apiClient, signal),
    })
}

export function useUserCatalogQuery() {
    const apiClient = useApiClient()
    return useQuery({
        queryKey: queryKeys.users.catalog,
        queryFn: ({ signal }) => getUserCatalog(apiClient, signal),
    })
}
