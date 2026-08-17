import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getOfferings } from '../services/offering.service'

export function useOfferingsQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.offerings.lists,
        queryFn: ({ signal }) => getOfferings(apiClient, signal),
    })
}
