import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type {
    DisableMfaPayload,
    MfaChallenge,
    MfaChallengePayload,
    MfaPasswordPayload,
    MfaStatus,
    TotpRecoveryCodes,
    TotpSetup,
} from '../interfaces/mfa.interface'

function responseData<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null || response.data === undefined) {
        throw new Error(response.error?.details || response.message || fallbackMessage)
    }
    return response.data
}

export async function getMfaStatus(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<MfaStatus> {
    const response = await apiClient.get<ApiResponse<MfaStatus>>('/auth/mfa', { signal })
    return responseData(response.data, 'No fue posible cargar la configuración')
}

export async function startTotpSetup(
    apiClient: AxiosInstance,
    payload: MfaPasswordPayload,
): Promise<TotpSetup> {
    const response = await apiClient.post<ApiResponse<TotpSetup>>('/auth/mfa/totp/start', payload)
    return responseData(response.data, 'No se pudo iniciar la configuración TOTP')
}

export async function confirmTotpSetup(
    apiClient: AxiosInstance,
    code: string,
): Promise<TotpRecoveryCodes> {
    const response = await apiClient.post<ApiResponse<TotpRecoveryCodes>>(
        '/auth/mfa/totp/confirm',
        { code },
    )
    return responseData(response.data, 'El código TOTP no pudo verificarse')
}

export async function startEmailSetup(
    apiClient: AxiosInstance,
    payload: MfaPasswordPayload,
): Promise<MfaChallenge> {
    const response = await apiClient.post<ApiResponse<MfaChallenge>>(
        '/auth/mfa/email/start',
        payload,
    )
    return responseData(response.data, 'No se pudo iniciar la configuración por correo')
}

export async function confirmEmailSetup(
    apiClient: AxiosInstance,
    payload: MfaChallengePayload,
): Promise<void> {
    const response = await apiClient.post<ApiResponse<null>>('/auth/mfa/email/confirm', payload)
    if (!response.data.success) {
        throw new Error(
            response.data.error?.details ||
                response.data.message ||
                'El código por correo no pudo verificarse',
        )
    }
}

export async function startEmailDisable(
    apiClient: AxiosInstance,
    payload: MfaPasswordPayload,
): Promise<MfaChallenge> {
    const response = await apiClient.post<ApiResponse<MfaChallenge>>(
        '/auth/mfa/email/disable-start',
        payload,
    )
    return responseData(response.data, 'No se pudo enviar el código de desactivación')
}

export async function disableMfa(
    apiClient: AxiosInstance,
    payload: DisableMfaPayload,
): Promise<void> {
    const response = await apiClient.post<ApiResponse<null>>('/auth/mfa/disable', payload)
    if (!response.data.success) {
        throw new Error(
            response.data.error?.details ||
                response.data.message ||
                'No se pudo desactivar el segundo factor',
        )
    }
}
