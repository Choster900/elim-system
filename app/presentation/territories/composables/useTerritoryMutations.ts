import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type {
    TerritoryHierarchy,
    TerritoryInput,
    TerritoryLevel,
} from '../interfaces/territory.interface'
import type { TerritoryImportPreview } from '../services/territory-excel.service'
import { importTerritories } from '../services/territory-excel.service'
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

interface ImportTerritoriesVariables {
    preview: TerritoryImportPreview
    hierarchy: TerritoryHierarchy
}

export function useCreateTerritoryMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.territories.all, 'create'],
        mutationFn: ({ level, input, parentId }: CreateTerritoryVariables) =>
            createTerritoryEntity(apiClient, level, input, parentId),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.territories.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.members.catalogs }),
            ])
        },
    })
}

export function useUpdateTerritoryMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.territories.all, 'update'],
        mutationFn: ({ level, id, input }: UpdateTerritoryVariables) =>
            updateTerritoryEntity(apiClient, level, id, input),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.territories.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.meetings.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.members.catalogs }),
            ])
        },
    })
}

export function useDeleteTerritoryMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.territories.all, 'delete'],
        mutationFn: ({ level, id }: DeleteTerritoryVariables) =>
            deleteTerritoryEntity(apiClient, level, id),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.territories.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.members.catalogs }),
            ])
        },
    })
}

export function useImportTerritoriesMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.territories.all, 'import'],
        mutationFn: ({ preview, hierarchy }: ImportTerritoriesVariables) =>
            importTerritories(apiClient, preview, hierarchy),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.territories.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.members.catalogs }),
            ])
        },
    })
}
