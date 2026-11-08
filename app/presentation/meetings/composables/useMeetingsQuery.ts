import { useQuery } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getMeetings } from '../services/meeting.service'

interface MeetingsQueryOptions {
    enabled?: MaybeRefOrGetter<boolean>
}

export function useMeetingsQuery(options: MeetingsQueryOptions = {}) {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.meetings.lists,
        queryFn: ({ signal }) => getMeetings(apiClient, signal),
        enabled: options.enabled ?? true,
    })
}
