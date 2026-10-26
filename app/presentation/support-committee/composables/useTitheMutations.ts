import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { SaveTitheInput } from '../interfaces/tithe.interface'
import { createTithe, deleteTithe, updateTithe } from '../services/tithe.service'

export function useSaveTitheMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.tithes.all, 'save'],
        mutationFn: ({ id, input }: { id: number | null; input: SaveTitheInput }) =>
            id === null ? createTithe(apiClient, input) : updateTithe(apiClient, id, input),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.tithes.all })
        },
    })
}

export function useDeleteTitheMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.tithes.all, 'delete'],
        mutationFn: (id: number) => deleteTithe(apiClient, id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.tithes.all })
        },
    })
}
