import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { OfferingRecord } from '../interfaces/offering.interface'
import { getOffering } from '../services/offering.service'

export function useOfferingQuery(id: MaybeRefOrGetter<number | null>) {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    const resolvedId = computed(() => {
        const value = toValue(id)
        return value !== null && Number.isInteger(value) && value > 0 ? value : null
    })

    return useQuery({
        queryKey: computed(() => queryKeys.offerings.detail(resolvedId.value ?? 0)),
        queryFn: ({ signal }) => {
            if (resolvedId.value === null) throw new Error('Identificador de ofrenda inválido')

            const cachedOffering = queryClient
                .getQueryData<OfferingRecord[]>(queryKeys.offerings.lists)
                ?.find((offering) => offering.id === resolvedId.value)

            return cachedOffering ?? getOffering(apiClient, resolvedId.value, signal)
        },
        enabled: computed(() => resolvedId.value !== null),
    })
}
