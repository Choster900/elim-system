import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import { createPermission, getPermissions, updatePermission } from '../services/permission.service'
import type { PermissionFormPayload } from '../interfaces/access-control.interface'

export function usePermissionsQuery() {
    const apiClient = useApiClient()
    return useQuery({
        queryKey: queryKeys.permissions.list,
        queryFn: ({ signal }) => getPermissions(apiClient, signal),
    })
}

export function useCreatePermissionMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: [...queryKeys.permissions.all, 'create'],
        mutationFn: (payload: PermissionFormPayload) => createPermission(apiClient, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
        },
    })
}

export function useUpdatePermissionMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: [...queryKeys.permissions.all, 'update'],
        mutationFn: ({ id, payload }: { id: number; payload: PermissionFormPayload }) =>
            updatePermission(apiClient, id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
        },
    })
}
