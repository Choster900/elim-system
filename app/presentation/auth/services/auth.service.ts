import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { LoginRequest } from '../interfaces/login-request.interface'
import type { LoginResponse } from '../interfaces/login-response.interface'

export async function loginRequest(client: AxiosInstance, payload: LoginRequest): Promise<LoginResponse> {
    const response = await client.post<ApiResponse<LoginResponse>>('/auth/login', payload)

    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'No fue posible iniciar sesión')
    }

    return response.data.data
}
