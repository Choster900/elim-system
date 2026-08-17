import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { TerritoryInput, TerritoryLevel } from '../interfaces/territory.interface'
import {
    createTerritoryEntity,
    deleteTerritoryEntity,
    updateTerritoryEntity,
} from '../services/territory.service'

interface CreateTerritoryVariables {
    level: TerritoryLevel
    input: TerritoryInput
    parentId?: string | null
}

interface UpdateTerritoryVariables {
    level: TerritoryLevel
    id: string
    input: Partial<TerritoryInput> & { parentId?: string }
}

interface DeleteTerritoryVariables {
    level: TerritoryLevel
    id: string
}

export function useCreateTerritoryMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.territories.all, 'create'],
        mutationFn: ({ level, input, parentId }: CreateTerritoryVariables) =>
            createTerritoryEntity(apiClient, level, input, parentId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.territories.all }),
    })
}

export function useUpdateTerritoryMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.territories.all, 'update'],
        mutationFn: ({ level, id, input }: UpdateTerritoryVariables) =>
            updateTerritoryEntity(apiClient, level, id, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.territories.all }),
    })
}

export function useDeleteTerritoryMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.territories.all, 'delete'],
        mutationFn: ({ level, id }: DeleteTerritoryVariables) =>
            deleteTerritoryEntity(apiClient, level, id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.territories.all }),
    })
}
