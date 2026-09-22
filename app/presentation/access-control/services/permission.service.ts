import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type {
    AccessPermission,
    PermissionFormPayload,
} from '../interfaces/access-control.interface'

interface PermissionsResponse extends ApiResponse<AccessPermission[]> {
    meta?: {
        pagination?: {
            totalItems: number
        }
    }
}

export async function getPermissions(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<AccessPermission[]> {
    const response = await apiClient.get<PermissionsResponse>('/permissions', {
        params: { page: 1, limit: 100 },
        signal,
    })
    if (!response.data.success || !response.data.data) {
        throw new Error(
            response.data.error?.details ||
                response.data.message ||
                'No fue posible cargar los permisos',
        )
    }
    return response.data.data
}

function responseData(response: ApiResponse<AccessPermission>, fallbackMessage: string) {
    if (!response.success || !response.data) {
        throw new Error(response.error?.details || response.message || fallbackMessage)
    }
    return response.data
}

export async function createPermission(apiClient: AxiosInstance, payload: PermissionFormPayload) {
    const response = await apiClient.post<ApiResponse<AccessPermission>>('/permissions', payload)
    return responseData(response.data, 'No fue posible crear el permiso')
}

export async function updatePermission(
    apiClient: AxiosInstance,
    id: number,
    payload: PermissionFormPayload,
) {
    const response = await apiClient.put<ApiResponse<AccessPermission>>(
        `/permissions/${id}`,
        payload,
    )
    return responseData(response.data, 'No fue posible actualizar el permiso')
}
