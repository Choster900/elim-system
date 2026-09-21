import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type {
    DisableMfaPayload,
    MfaChallengePayload,
    MfaPasswordPayload,
} from '../interfaces/mfa.interface'
import {
    confirmEmailSetup,
    confirmTotpSetup,
    disableMfa,
    startEmailDisable,
    startEmailSetup,
    startTotpSetup,
} from '../services/mfa.service'

export function useStartTotpSetupMutation() {
    const apiClient = useApiClient()
    return useMutation({
        mutationKey: [...queryKeys.settings.all, 'mfa', 'totp-start'],
        mutationFn: (payload: MfaPasswordPayload) => startTotpSetup(apiClient, payload),
    })
}

export function useConfirmTotpSetupMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: [...queryKeys.settings.all, 'mfa', 'totp-confirm'],
        mutationFn: (code: string) => confirmTotpSetup(apiClient, code),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.mfa }),
    })
}

export function useStartEmailSetupMutation() {
    const apiClient = useApiClient()
    return useMutation({
        mutationKey: [...queryKeys.settings.all, 'mfa', 'email-start'],
        mutationFn: (payload: MfaPasswordPayload) => startEmailSetup(apiClient, payload),
    })
}

export function useConfirmEmailSetupMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: [...queryKeys.settings.all, 'mfa', 'email-confirm'],
        mutationFn: (payload: MfaChallengePayload) => confirmEmailSetup(apiClient, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.mfa }),
    })
}

export function useStartEmailDisableMutation() {
    const apiClient = useApiClient()
    return useMutation({
        mutationKey: [...queryKeys.settings.all, 'mfa', 'email-disable-start'],
        mutationFn: (payload: MfaPasswordPayload) => startEmailDisable(apiClient, payload),
    })
}

export function useDisableMfaMutation() {
    const apiClient = useApiClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: [...queryKeys.settings.all, 'mfa', 'disable'],
        mutationFn: (payload: DisableMfaPayload) => disableMfa(apiClient, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.mfa }),
    })
}
