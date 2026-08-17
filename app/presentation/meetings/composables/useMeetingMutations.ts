import { useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { MeetingInput, MeetingRecord } from '../interfaces/meeting.interface'
import { createMeeting, deleteMeeting, updateMeeting } from '../services/meeting.service'

interface UpdateMeetingVariables {
    id: number
    input: Partial<MeetingInput>
}

async function invalidateMeetingCollections(queryClient: QueryClient) {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.meetings.lists }),
        queryClient.invalidateQueries({ queryKey: queryKeys.meetings.options }),
    ])
}

function updateMeetingList(queryClient: QueryClient, meeting: MeetingRecord) {
    queryClient.setQueryData<MeetingRecord[]>(queryKeys.meetings.lists, (current) =>
        current?.map((item) => (item.id === meeting.id ? meeting : item)),
    )
}

export function useCreateMeetingMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.meetings.all, 'create'],
        mutationFn: (input: MeetingInput) => createMeeting(apiClient, input),
        onSuccess: async (meeting) => {
            queryClient.setQueryData(queryKeys.meetings.detail(meeting.id), meeting)
            await invalidateMeetingCollections(queryClient)
        },
    })
}

export function useUpdateMeetingMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.meetings.all, 'update'],
        mutationFn: ({ id, input }: UpdateMeetingVariables) => updateMeeting(apiClient, id, input),
        onSuccess: async (meeting) => {
            queryClient.setQueryData(queryKeys.meetings.detail(meeting.id), meeting)
            updateMeetingList(queryClient, meeting)
            await invalidateMeetingCollections(queryClient)
        },
    })
}

export function useDeleteMeetingMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.meetings.all, 'delete'],
        mutationFn: (id: number) => deleteMeeting(apiClient, id),
        onSuccess: async (_, id) => {
            queryClient.removeQueries({ queryKey: queryKeys.meetings.detail(id), exact: true })
            queryClient.setQueryData<MeetingRecord[]>(queryKeys.meetings.lists, (current) =>
                current?.filter((meeting) => meeting.id !== id),
            )
            await invalidateMeetingCollections(queryClient)
        },
    })
}
