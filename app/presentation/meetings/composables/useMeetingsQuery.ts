import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getMeetings } from '../services/meeting.service'

export function useMeetingsQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.meetings.lists,
        queryFn: ({ signal }) => getMeetings(apiClient, signal),
    })
}
