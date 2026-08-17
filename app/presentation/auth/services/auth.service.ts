import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { LoginRequest } from '../interfaces/login-request.interface'
import type {
    AuthUser,
    ChangePasswordRequest,
    InvitationDetails,
    LoginResponse,
} from '../interfaces/login-response.interface'

export async function loginRequest(
    client: AxiosInstance,
    payload: LoginRequest,
): Promise<LoginResponse> {
    const response = await client.post<ApiResponse<LoginResponse>>('/auth/login', payload)

    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'No fue posible iniciar sesión')
    }

    return response.data.data
}

export async function logoutRequest(client: AxiosInstance): Promise<void> {
    await client.post<ApiResponse<null>>('/auth/logout')
}

export async function currentUserRequest(client: AxiosInstance): Promise<AuthUser> {
    const response = await client.get<ApiResponse<AuthUser>>('/auth/me')

    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'No fue posible validar la sesión')
    }

    return response.data.data
}

export async function validateInvitationRequest(
    client: AxiosInstance,
    invitationToken: string,
    signal?: AbortSignal,
): Promise<InvitationDetails> {
    const response = await client.post<ApiResponse<InvitationDetails>>(
        '/auth/invitations/validate',
        { invitationToken },
        { signal },
    )

    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'La invitación no es válida')
    }
    return response.data.data
}

export async function changePasswordRequest(
    client: AxiosInstance,
    payload: ChangePasswordRequest,
): Promise<LoginResponse> {
    const response = await client.post<ApiResponse<LoginResponse>>('/auth/change-password', payload)

    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'No fue posible actualizar la contraseña')
    }
    return response.data.data
}
