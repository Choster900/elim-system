import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { LoginRequest } from '../interfaces/login-request.interface'
import type { AuthUser, LoginResponse } from '../interfaces/login-response.interface'

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
