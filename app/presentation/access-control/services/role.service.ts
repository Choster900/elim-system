import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { AccessRole, RoleFormPayload } from '../interfaces/access-control.interface'

export async function getRoles(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<AccessRole[]> {
    const response = await apiClient.get<ApiResponse<AccessRole[]>>('/roles', { signal })
    if (!response.data.success || !response.data.data) {
        throw new Error(
            response.data.error?.details ||
                response.data.message ||
                'No fue posible cargar los roles',
        )
    }
    return response.data.data
}

function responseData(response: ApiResponse<AccessRole>, fallbackMessage: string) {
    if (!response.success || !response.data) {
        throw new Error(response.error?.details || response.message || fallbackMessage)
    }
    return response.data
}

export async function createRole(apiClient: AxiosInstance, payload: RoleFormPayload) {
    const response = await apiClient.post<ApiResponse<AccessRole>>('/roles', payload)
    return responseData(response.data, 'No fue posible crear el rol')
}

export async function updateRole(apiClient: AxiosInstance, id: number, payload: RoleFormPayload) {
    const response = await apiClient.put<ApiResponse<AccessRole>>(`/roles/${id}`, payload)
    return responseData(response.data, 'No fue posible actualizar el rol')
}
