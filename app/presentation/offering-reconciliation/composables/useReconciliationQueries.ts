import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { ReconciliationFilters } from '../interfaces/reconciliation.interface'
import {
    closeDiscrepancy,
    getEnvelopeReview,
    getReconciliation,
} from '../services/reconciliation.service'

export function useReconciliationQuery(filters: ComputedRef<ReconciliationFilters>) {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: computed(() => queryKeys.offeringReconciliation.summary(filters.value)),
        queryFn: ({ signal }) => getReconciliation(apiClient, filters.value, signal),
        placeholderData: (previous) => previous,
    })
}

export function useEnvelopeReviewQuery(occurrenceId: Ref<number | null>) {
    const apiClient = useApiClient()

    return useQuery({
        queryKey: computed(() =>
            queryKeys.offeringReconciliation.envelope(occurrenceId.value ?? 0),
        ),
        queryFn: ({ signal }) => getEnvelopeReview(apiClient, occurrenceId.value!, signal),
        enabled: computed(() => occurrenceId.value !== null),
        retry: false,
    })
}

export function useCloseDiscrepancyMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.offeringReconciliation.all, 'close'],
        mutationFn: ({ occurrenceId, notes }: { occurrenceId: number; notes: string }) =>
            closeDiscrepancy(apiClient, occurrenceId, notes),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.offeringReconciliation.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.offeringReceptions.all }),
            ])
        },
    })
}
