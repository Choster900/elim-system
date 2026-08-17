import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getMeetingOptions, getOfferingCategories } from '../services/offering.service'

const CATALOG_STALE_TIME_MS = 5 * 60_000

export function useOfferingCategoriesQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.offeringCategories.list,
        queryFn: ({ signal }) => getOfferingCategories(apiClient, signal),
        staleTime: CATALOG_STALE_TIME_MS,
    })
}

export function useOfferingMeetingOptionsQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.meetings.options,
        queryFn: ({ signal }) => getMeetingOptions(apiClient, signal),
        staleTime: CATALOG_STALE_TIME_MS,
    })
}
