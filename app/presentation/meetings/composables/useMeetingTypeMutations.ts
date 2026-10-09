import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { MeetingTypeOption } from '../interfaces/meeting.interface'
import {
    createMeetingType,
    deleteMeetingType,
    updateMeetingType,
} from '../services/meeting.service'

type TypeInput = Pick<MeetingTypeOption, 'name' | 'codeSegment' | 'isActive' | 'isGeneral'>

export function useCreateMeetingTypeMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: TypeInput) => createMeetingType(apiClient, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.meetingTypes.list }),
    })
}

export function useUpdateMeetingTypeMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, input }: { id: number; input: Partial<TypeInput> }) =>
            updateMeetingType(apiClient, id, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.meetingTypes.list }),
    })
}

export function useDeleteMeetingTypeMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => deleteMeetingType(apiClient, id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.meetingTypes.list }),
    })
}
