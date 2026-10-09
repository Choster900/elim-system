import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { ReceiveEnvelopeInput } from '../interfaces/reception.interface'
import { correctReception, receiveEnvelope } from '../services/reception.service'

interface ReceptionVariables {
    occurrenceId: number
    input: ReceiveEnvelopeInput
}

export function useSaveReceptionMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: [...queryKeys.offeringReceptions.all, 'save'],
        mutationFn: ({
            occurrenceId,
            input,
            isCorrection,
        }: ReceptionVariables & { isCorrection: boolean }) =>
            isCorrection
                ? correctReception(apiClient, occurrenceId, input)
                : receiveEnvelope(apiClient, occurrenceId, input),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.offeringReceptions.all })
        },
    })
}
