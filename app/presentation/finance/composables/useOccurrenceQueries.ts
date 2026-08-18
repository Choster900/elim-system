import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { OccurrenceFilters } from '../interfaces/occurrence.interface'
import {
    getMeetingHistory,
    getOccurrence,
    getOccurrences,
    getOfferingCategories,
    getOfferingMeetingOptions,
    getPendingOccurrences,
} from '../services/occurrence.service'

export function usePendingOccurrencesQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.occurrences.pending,
        queryFn: ({ signal }) => getPendingOccurrences(apiClient, signal),
    })
}

export function useOccurrencesQuery(filters: Ref<OccurrenceFilters>) {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: computed(() => queryKeys.occurrences.list(filters.value)),
        queryFn: ({ signal }) => getOccurrences(apiClient, filters.value, signal),
    })
}

export function useOccurrenceQuery(id: Ref<number | null>) {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: computed(() => queryKeys.occurrences.detail(id.value ?? 0)),
        queryFn: ({ signal }) => getOccurrence(apiClient, id.value!, signal),
        enabled: computed(() => id.value !== null),
    })
}

export function useMeetingHistoryQuery(meetingId: Ref<number | null>) {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: computed(() => queryKeys.occurrences.meetingHistory(meetingId.value ?? 0)),
        queryFn: ({ signal }) => getMeetingHistory(apiClient, meetingId.value!, signal),
        enabled: computed(() => meetingId.value !== null),
    })
}

export function useOfferingCategoriesQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.offeringCategories.list,
        queryFn: ({ signal }) => getOfferingCategories(apiClient, signal),
    })
}

export function useOfferingMeetingOptionsQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.meetings.options,
        queryFn: ({ signal }) => getOfferingMeetingOptions(apiClient, signal),
    })
}
