import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type {
    MeetingInput,
    MeetingRecord,
    MeetingTypeOption,
    MemberOption,
    SectorOption,
} from '../interfaces/meeting.interface'

interface HierarchySectorApiEntity {
    id: number
    name: string
    code: string
    polygon: unknown
}

interface HierarchyApiResponse {
    sectors: HierarchySectorApiEntity[]
}

function responseData<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null || response.data === undefined) {
        throw new Error(response.error?.details || response.message || fallbackMessage)
    }
    return response.data
}

function normalizePolygon(value: unknown): [number, number][] {
    if (!Array.isArray(value)) return []
    return value.flatMap((point) => {
        if (
            !Array.isArray(point) ||
            point.length !== 2 ||
            typeof point[0] !== 'number' ||
            typeof point[1] !== 'number'
        ) {
            return []
        }
        return [[point[0], point[1]] as [number, number]]
    })
}

export async function getMeetings(apiClient: AxiosInstance): Promise<MeetingRecord[]> {
    const response = await apiClient.get<ApiResponse<MeetingRecord[]>>('/meetings')
    return responseData(response.data, 'No fue posible cargar las reuniones')
}

export async function getMeeting(apiClient: AxiosInstance, id: number): Promise<MeetingRecord> {
    const response = await apiClient.get<ApiResponse<MeetingRecord>>(`/meetings/${id}`)
    return responseData(response.data, 'No fue posible cargar la reunión')
}

export async function createMeeting(
    apiClient: AxiosInstance,
    input: MeetingInput,
): Promise<MeetingRecord> {
    const response = await apiClient.post<ApiResponse<MeetingRecord>>('/meetings', input)
    return responseData(response.data, 'No fue posible crear la reunión')
}

export async function updateMeeting(
    apiClient: AxiosInstance,
    id: number,
    input: Partial<MeetingInput>,
): Promise<MeetingRecord> {
    const response = await apiClient.put<ApiResponse<MeetingRecord>>(`/meetings/${id}`, input)
    return responseData(response.data, 'No fue posible actualizar la reunión')
}

export async function deleteMeeting(apiClient: AxiosInstance, id: number): Promise<void> {
    await apiClient.delete(`/meetings/${id}`)
}

export async function getMeetingTypes(apiClient: AxiosInstance): Promise<MeetingTypeOption[]> {
    const response = await apiClient.get<ApiResponse<MeetingTypeOption[]>>('/meeting-types')
    return responseData(response.data, 'No fue posible cargar los tipos de reunión')
}

export async function getMembers(apiClient: AxiosInstance): Promise<MemberOption[]> {
    const response = await apiClient.get<ApiResponse<MemberOption[]>>('/members')
    return responseData(response.data, 'No fue posible cargar los miembros')
}

export async function getSectors(apiClient: AxiosInstance): Promise<SectorOption[]> {
    const response = await apiClient.get<ApiResponse<HierarchyApiResponse>>('/territories')
    const data = responseData(response.data, 'No fue posible cargar los sectores')
    return data.sectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        code: sector.code,
        polygon: normalizePolygon(sector.polygon),
    }))
}
