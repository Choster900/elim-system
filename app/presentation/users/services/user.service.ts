import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type {
    ResetUserPasswordPayload,
    SystemUser,
    UserCatalog,
    UserFormPayload,
} from '../interfaces/user.interface'

function responseData<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null || response.data === undefined) {
        throw new Error(response.error?.details || response.message || fallbackMessage)
    }
    return response.data
}

export async function getUsers(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<SystemUser[]> {
    const response = await apiClient.get<ApiResponse<SystemUser[]>>('/users', { signal })
    return responseData(response.data, 'No fue posible cargar los usuarios')
}

export async function getUserCatalog(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<UserCatalog> {
    const response = await apiClient.get<ApiResponse<UserCatalog>>('/users/catalog', { signal })
    return responseData(response.data, 'No fue posible cargar el catálogo de usuarios')
}

export async function createUser(
    apiClient: AxiosInstance,
    payload: UserFormPayload,
): Promise<SystemUser> {
    const response = await apiClient.post<ApiResponse<SystemUser>>('/users', {
        memberId: payload.memberId,
        username: payload.username,
        email: payload.email,
        roleCodes: payload.roles,
        requirePasswordChange: payload.requirePasswordChange,
        twoFactorEnabled: payload.twoFactorEnabled,
        invitationExpiresInHours: payload.invitationExpiresInHours,
    })
    return responseData(response.data, 'No fue posible crear el usuario')
}

export async function updateUser(
    apiClient: AxiosInstance,
    id: number,
    payload: UserFormPayload,
): Promise<SystemUser> {
    const response = await apiClient.put<ApiResponse<SystemUser>>(`/users/${id}`, {
        username: payload.username,
        email: payload.email,
        roleCodes: payload.roles,
        status: payload.status,
        requirePasswordChange: payload.requirePasswordChange,
        twoFactorEnabled: payload.twoFactorEnabled,
    })
    return responseData(response.data, 'No fue posible actualizar el usuario')
}

export async function updateUserStatus(
    apiClient: AxiosInstance,
    id: number,
    status: 'ACTIVE' | 'BLOCKED',
): Promise<SystemUser> {
    const response = await apiClient.patch<ApiResponse<SystemUser>>(`/users/${id}/status`, {
        status,
    })
    return responseData(response.data, 'No fue posible cambiar el estado del usuario')
}

export async function resetUserPassword(
    apiClient: AxiosInstance,
    id: number,
    payload: ResetUserPasswordPayload,
): Promise<SystemUser> {
    const response = await apiClient.post<ApiResponse<SystemUser>>(
        `/users/${id}/reset-password`,
        payload,
    )
    return responseData(response.data, 'No fue posible restablecer el acceso')
}
