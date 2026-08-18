import { useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { BulkRecordEntry, RecordOccurrenceInput } from '../interfaces/occurrence.interface'
import {
    recordOccurrence,
    recordOccurrencesBulk,
    updateOccurrence,
} from '../services/occurrence.service'

interface RecordVariables {
    id: number
    input: RecordOccurrenceInput
}

interface UpdateVariables {
    id: number
    input: Partial<RecordOccurrenceInput>
}

// Registrar mueve la fecha fuera de la bandeja, así que se invalida todo lo que la refleja.
async function invalidateOccurrenceViews(queryClient: QueryClient) {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.occurrences.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ])
}

export function useRecordOccurrenceMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.occurrences.all, 'record'],
        mutationFn: ({ id, input }: RecordVariables) => recordOccurrence(apiClient, id, input),
        onSuccess: async () => invalidateOccurrenceViews(queryClient),
    })
}

export function useRecordOccurrencesBulkMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.occurrences.all, 'record-bulk'],
        mutationFn: (entries: BulkRecordEntry[]) => recordOccurrencesBulk(apiClient, entries),
        onSuccess: async () => invalidateOccurrenceViews(queryClient),
    })
}

export function useUpdateOccurrenceMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.occurrences.all, 'update'],
        mutationFn: ({ id, input }: UpdateVariables) => updateOccurrence(apiClient, id, input),
        onSuccess: async () => invalidateOccurrenceViews(queryClient),
    })
}
