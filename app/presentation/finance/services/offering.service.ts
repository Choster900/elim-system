import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type {
    MeetingOption,
    OfferingCategoryOption,
    OfferingInput,
    OfferingRecord,
} from '../interfaces/offering.interface'

interface MeetingApiEntity {
    id: number
    title: string
    date: string
    sectorName: string | null
    color: string
}

function responseData<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null || response.data === undefined) {
        throw new Error(response.error?.details || response.message || fallbackMessage)
    }
    return response.data
}

export async function getOfferings(apiClient: AxiosInstance): Promise<OfferingRecord[]> {
    const response = await apiClient.get<ApiResponse<OfferingRecord[]>>('/offerings')
    return responseData(response.data, 'No fue posible cargar las ofrendas')
}

export async function getOffering(apiClient: AxiosInstance, id: number): Promise<OfferingRecord> {
    const offerings = await getOfferings(apiClient)
    const found = offerings.find((offering) => offering.id === id)
    if (!found) throw new Error('Ofrenda no encontrada')
    return found
}

export async function createOffering(
    apiClient: AxiosInstance,
    input: OfferingInput,
): Promise<OfferingRecord> {
    const response = await apiClient.post<ApiResponse<OfferingRecord>>('/offerings', input)
    return responseData(response.data, 'No fue posible registrar la ofrenda')
}

export async function updateOffering(
    apiClient: AxiosInstance,
    id: number,
    input: Partial<OfferingInput>,
): Promise<OfferingRecord> {
    const response = await apiClient.put<ApiResponse<OfferingRecord>>(`/offerings/${id}`, input)
    return responseData(response.data, 'No fue posible actualizar la ofrenda')
}

export async function deleteOffering(apiClient: AxiosInstance, id: number): Promise<void> {
    await apiClient.delete(`/offerings/${id}`)
}

export async function getOfferingCategories(
    apiClient: AxiosInstance,
): Promise<OfferingCategoryOption[]> {
    const response =
        await apiClient.get<ApiResponse<OfferingCategoryOption[]>>('/offering-categories')
    return responseData(response.data, 'No fue posible cargar las categorías de ofrenda')
}

export async function getMeetingOptions(apiClient: AxiosInstance): Promise<MeetingOption[]> {
    const response = await apiClient.get<ApiResponse<MeetingApiEntity[]>>('/offerings/meetings')
    const data = responseData(response.data, 'No fue posible cargar las reuniones')
    return data.map((meeting) => ({
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        sectorName: meeting.sectorName,
        color: meeting.color,
    }))
}
