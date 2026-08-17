import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import {
    getMembers,
    getMeetingLeaders,
    getMeetingTypes,
    getSectors,
} from '../services/meeting.service'

const CATALOG_STALE_TIME_MS = 5 * 60_000

export function useMeetingTypesQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.meetingTypes.list,
        queryFn: ({ signal }) => getMeetingTypes(apiClient, signal),
        staleTime: CATALOG_STALE_TIME_MS,
    })
}

export function useMeetingMembersQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.members.options,
        queryFn: ({ signal }) => getMembers(apiClient, signal),
        staleTime: CATALOG_STALE_TIME_MS,
    })
}

export function useMeetingLeadersQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.members.meetingLeaders,
        queryFn: ({ signal }) => getMeetingLeaders(apiClient, signal),
        staleTime: CATALOG_STALE_TIME_MS,
    })
}

export function useMeetingSectorsQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.territories.sectorOptions,
        queryFn: ({ signal }) => getSectors(apiClient, signal),
        staleTime: CATALOG_STALE_TIME_MS,
    })
}
