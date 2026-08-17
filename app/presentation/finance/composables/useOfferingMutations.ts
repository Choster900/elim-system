import { useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { OfferingInput, OfferingRecord } from '../interfaces/offering.interface'
import {
    createOffering,
    createOfferingsBulk,
    deleteOffering,
    updateOffering,
} from '../services/offering.service'

interface UpdateOfferingVariables {
    id: number
    input: Partial<OfferingInput>
}

async function invalidateOfferingLists(queryClient: QueryClient) {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.offerings.lists }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ])
}

export function useCreateOfferingMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.offerings.all, 'create'],
        mutationFn: (input: OfferingInput) => createOffering(apiClient, input),
        onSuccess: async (offering) => {
            queryClient.setQueryData(queryKeys.offerings.detail(offering.id), offering)
            await invalidateOfferingLists(queryClient)
        },
    })
}

export function useCreateOfferingsBulkMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.offerings.all, 'create-bulk'],
        mutationFn: (offerings: OfferingInput[]) => createOfferingsBulk(apiClient, offerings),
        onSuccess: async () => invalidateOfferingLists(queryClient),
    })
}

export function useUpdateOfferingMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.offerings.all, 'update'],
        mutationFn: ({ id, input }: UpdateOfferingVariables) =>
            updateOffering(apiClient, id, input),
        onSuccess: async (offering) => {
            queryClient.setQueryData(queryKeys.offerings.detail(offering.id), offering)
            queryClient.setQueryData<OfferingRecord[]>(queryKeys.offerings.lists, (current) =>
                current?.map((item) => (item.id === offering.id ? offering : item)),
            )
            await invalidateOfferingLists(queryClient)
        },
    })
}

export function useDeleteOfferingMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.offerings.all, 'delete'],
        mutationFn: (id: number) => deleteOffering(apiClient, id),
        onSuccess: async (_, id) => {
            queryClient.removeQueries({ queryKey: queryKeys.offerings.detail(id), exact: true })
            queryClient.setQueryData<OfferingRecord[]>(queryKeys.offerings.lists, (current) =>
                current?.filter((offering) => offering.id !== id),
            )
            await invalidateOfferingLists(queryClient)
        },
    })
}
