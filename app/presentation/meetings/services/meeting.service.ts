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
    supervisorId: number | null
    supervisorName: string | null
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

export async function getMeetings(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<MeetingRecord[]> {
    const response = await apiClient.get<ApiResponse<MeetingRecord[]>>('/meetings', { signal })
    return responseData(response.data, 'No fue posible cargar las reuniones')
}

export async function getMeeting(
    apiClient: AxiosInstance,
    id: number,
    signal?: AbortSignal,
): Promise<MeetingRecord> {
    const response = await apiClient.get<ApiResponse<MeetingRecord>>(`/meetings/${id}`, { signal })
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

export async function getMeetingTypes(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<MeetingTypeOption[]> {
    const response = await apiClient.get<ApiResponse<MeetingTypeOption[]>>('/meeting-types', {
        signal,
    })
    return responseData(response.data, 'No fue posible cargar los tipos de reunión')
}

export async function getMembers(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<MemberOption[]> {
    const response = await apiClient.get<ApiResponse<MemberOption[]>>('/members', { signal })
    return responseData(response.data, 'No fue posible cargar los miembros')
}

export async function getMeetingLeaders(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<MemberOption[]> {
    const response = await apiClient.get<ApiResponse<MemberOption[]>>('/meetings/leaders', {
        signal,
    })
    return responseData(response.data, 'No fue posible cargar los líderes de reunión')
}

export async function getSectors(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<SectorOption[]> {
    const response = await apiClient.get<ApiResponse<HierarchyApiResponse>>('/territories', {
        signal,
    })
    const data = responseData(response.data, 'No fue posible cargar los sectores')
    return data.sectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        code: sector.code,
        polygon: normalizePolygon(sector.polygon),
        supervisorId: sector.supervisorId,
        supervisorName: sector.supervisorName,
    }))
}
