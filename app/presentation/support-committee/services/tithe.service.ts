import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type {
    SaveTitheInput,
    TitheList,
    TitheMember,
    TitheRecord,
} from '../interfaces/tithe.interface'

function responseData<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null || response.data === undefined) {
        throw new Error(response.error?.details || response.message || fallbackMessage)
    }
    return response.data
}

export async function getTithes(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<TitheList> {
    const response = await apiClient.get<ApiResponse<TitheList>>('/tithes', { signal })
    return responseData(response.data, 'No fue posible cargar los diezmos')
}

export async function getTithers(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<TitheMember[]> {
    const response = await apiClient.get<ApiResponse<TitheMember[]>>('/tithes/diezmadores', {
        signal,
    })
    return responseData(response.data, 'No fue posible cargar los diezmadores')
}

export async function createTithe(
    apiClient: AxiosInstance,
    input: SaveTitheInput,
): Promise<TitheRecord> {
    const response = await apiClient.post<ApiResponse<TitheRecord>>('/tithes', input)
    return responseData(response.data, 'No fue posible registrar el diezmo')
}

export async function updateTithe(
    apiClient: AxiosInstance,
    id: number,
    input: SaveTitheInput,
): Promise<TitheRecord> {
    const response = await apiClient.put<ApiResponse<TitheRecord>>(`/tithes/${id}`, input)
    return responseData(response.data, 'No fue posible actualizar el diezmo')
}

export async function deleteTithe(apiClient: AxiosInstance, id: number): Promise<TitheRecord> {
    const response = await apiClient.delete<ApiResponse<TitheRecord>>(`/tithes/${id}`)
    return responseData(response.data, 'No fue posible eliminar el diezmo')
}
