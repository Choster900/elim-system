import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { getMeeting } from '../services/meeting.service'

export function useMeetingQuery(id: MaybeRefOrGetter<number | null>) {
    const apiClient = useApiClient()
    const resolvedId = computed(() => {
        const value = toValue(id)
        return value !== null && Number.isInteger(value) && value > 0 ? value : null
    })

    return useQuery({
        queryKey: computed(() => queryKeys.meetings.detail(resolvedId.value ?? 0)),
        queryFn: ({ signal }) => {
            if (resolvedId.value === null) throw new Error('Identificador de reunión inválido')
            return getMeeting(apiClient, resolvedId.value, signal)
        },
        enabled: computed(() => resolvedId.value !== null),
    })
}
