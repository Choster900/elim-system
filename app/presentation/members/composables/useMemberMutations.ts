import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { MemberInput } from '../interfaces/member.interface'
import { createMember, deleteMember, importMembers, updateMember } from '../services/member.service'

interface UpdateMemberVariables {
    id: number
    input: Partial<MemberInput>
}

export function useCreateMemberMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.members.all, 'create'],
        mutationFn: (input: MemberInput) => createMember(apiClient, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.all }),
    })
}

export function useUpdateMemberMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.members.all, 'update'],
        mutationFn: ({ id, input }: UpdateMemberVariables) => updateMember(apiClient, id, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.all }),
    })
}

export function useDeleteMemberMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.members.all, 'delete'],
        mutationFn: (id: number) => deleteMember(apiClient, id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.all }),
    })
}

export function useImportMembersMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.members.all, 'import'],
        mutationFn: (members: MemberInput[]) => importMembers(apiClient, members),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.all }),
    })
}
