import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { createRole, getRoles, updateRole } from '../services/role.service'
import type { RoleFormPayload } from '../interfaces/access-control.interface'

export function useRolesQuery() {
    const apiClient = useApiClient()
    return useQuery({
        queryKey: queryKeys.roles.list,
        queryFn: ({ signal }) => getRoles(apiClient, signal),
    })
}

export function useCreateRoleMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: [...queryKeys.roles.all, 'create'],
        mutationFn: (payload: RoleFormPayload) => createRole(apiClient, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all })
        },
    })
}

export function useUpdateRoleMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: [...queryKeys.roles.all, 'update'],
        mutationFn: ({ id, payload }: { id: number; payload: RoleFormPayload }) =>
            updateRole(apiClient, id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all })
        },
    })
}
