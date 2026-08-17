import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { ResetUserPasswordPayload, UserFormPayload } from '../interfaces/user.interface'
import {
    createUser,
    resetUserPassword,
    updateUser,
    updateUserStatus,
} from '../services/user.service'

export function useCreateUserMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: [...queryKeys.users.all, 'create'],
        mutationFn: (payload: UserFormPayload) => createUser(apiClient, payload),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.users.list }),
                queryClient.invalidateQueries({ queryKey: queryKeys.users.catalog }),
            ])
        },
    })
}

export function useUpdateUserMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: [...queryKeys.users.all, 'update'],
        mutationFn: ({ id, payload }: { id: number; payload: UserFormPayload }) =>
            updateUser(apiClient, id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.list }),
    })
}

export function useUpdateUserStatusMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: [...queryKeys.users.all, 'status'],
        mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'BLOCKED' }) =>
            updateUserStatus(apiClient, id, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.list }),
    })
}

export function useResetUserPasswordMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: [...queryKeys.users.all, 'reset-password'],
        mutationFn: ({ id, payload }: { id: number; payload: ResetUserPasswordPayload }) =>
            resetUserPassword(apiClient, id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.list }),
    })
}
