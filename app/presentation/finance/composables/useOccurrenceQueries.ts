import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { OccurrenceFilters } from '../interfaces/occurrence.interface'
import {
    getAttendanceTypes,
    getMeetingHistory,
    getOccurrence,
    getOccurrences,
    getOfferingCategories,
    getPendingOccurrences,
} from '../services/occurrence.service'

export function usePendingOccurrencesQuery(options: { autoRefresh?: boolean } = {}) {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.occurrences.pending,
        queryFn: ({ signal }) => getPendingOccurrences(apiClient, signal),
        refetchInterval: options.autoRefresh ? 60_000 : false,
        refetchOnWindowFocus: options.autoRefresh ?? false,
    })
}

// Solo se lee, así que acepta también un computed con los filtros derivados.
export function useOccurrencesQuery(
    filters: Ref<OccurrenceFilters> | ComputedRef<OccurrenceFilters>,
) {
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

export function useAttendanceTypesQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.attendanceTypes.list,
        queryFn: ({ signal }) => getAttendanceTypes(apiClient, signal),
    })
}

export function useOfferingCategoriesQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.offeringCategories.list,
        queryFn: ({ signal }) => getOfferingCategories(apiClient, signal),
    })
}
