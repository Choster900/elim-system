import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type {
    PendingEnvelopesParams,
    ReceptionCountInput,
    ReceptionFilters,
} from '../interfaces/reception.interface'
import {
    compareEnvelope,
    getDenominations,
    getEnvelope,
    getPendingEnvelopes,
    getReceptions,
} from '../services/reception.service'

export function usePendingEnvelopesQuery(
    params: Ref<PendingEnvelopesParams> | ComputedRef<PendingEnvelopesParams>,
) {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: computed(() => queryKeys.offeringReceptions.pendingPage(params.value)),
        queryFn: ({ signal }) => getPendingEnvelopes(apiClient, params.value, signal),
        placeholderData: (previous) => previous,
        refetchInterval: 60_000,
        refetchOnWindowFocus: true,
    })
}

export function usePendingCountQuery() {
    const query = usePendingEnvelopesQuery(computed(() => ({ page: 1, limit: 1 })))
    return computed(() => query.data.value?.pagination.totalItems ?? null)
}

export function useReceptionsQuery(filters: Ref<ReceptionFilters> | ComputedRef<ReceptionFilters>) {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: computed(() => queryKeys.offeringReceptions.list(filters.value)),
        queryFn: ({ signal }) => getReceptions(apiClient, filters.value, signal),
        placeholderData: (previous) => previous,
    })
}

export function useEnvelopeQuery(occurrenceId: Ref<number | null>) {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: computed(() => queryKeys.offeringReceptions.envelope(occurrenceId.value ?? 0)),
        queryFn: ({ signal }) => getEnvelope(apiClient, occurrenceId.value!, signal),
        enabled: computed(() => occurrenceId.value !== null),
        retry: false,
    })
}

export function useEnvelopeComparisonQuery(
    occurrenceId: Ref<number | null>,
    input: Ref<ReceptionCountInput | null> | ComputedRef<ReceptionCountInput | null>,
) {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: computed(() =>
            queryKeys.offeringReceptions.comparison(occurrenceId.value ?? 0, input.value ?? {}),
        ),
        queryFn: ({ signal }) =>
            compareEnvelope(apiClient, occurrenceId.value!, input.value!, signal),
        enabled: computed(() => occurrenceId.value !== null && input.value !== null),
        retry: false,
    })
}

export function useDenominationsQuery() {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: queryKeys.denominations.list,
        queryFn: ({ signal }) => getDenominations(apiClient, signal),
        staleTime: 10 * 60_000,
    })
}
