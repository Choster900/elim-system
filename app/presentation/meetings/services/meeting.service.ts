import type { AxiosInstance } from 'axios'
import { territoryPathCode } from '#shared/utils/territory-code.util'
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
    zoneId: number
    polygon: unknown
    supervisorId: number | null
    supervisorName: string | null
}

interface HierarchyApiResponse {
    districts: Array<{ id: number; name: string; code: string }>
    zones: Array<{ id: number; name: string; code: string; districtId: number }>
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

export async function getMeetingLeaders(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<MemberOption[]> {
    const response = await apiClient.get<ApiResponse<MemberOption[]>>('/meetings/leaders', {
        signal,
    })
    return responseData(response.data, 'No fue posible cargar los líderes de reunión')
}

export async function getMeetingSupervisors(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<MemberOption[]> {
    const response = await apiClient.get<ApiResponse<MemberOption[]>>('/meetings/supervisors', {
        signal,
    })
    return responseData(response.data, 'No fue posible cargar los supervisores de reunión')
}

export async function getMeetingHosts(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<MemberOption[]> {
    const response = await apiClient.get<ApiResponse<MemberOption[]>>('/meetings/hosts', { signal })
    return responseData(response.data, 'No fue posible cargar los anfitriones de reunión')
}

export async function getSectors(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<SectorOption[]> {
    const response = await apiClient.get<ApiResponse<HierarchyApiResponse>>('/territories', {
        signal,
    })
    const data = responseData(response.data, 'No fue posible cargar los sectores')
    const districts = new Map(data.districts.map((district) => [district.id, district]))
    const zones = new Map(data.zones.map((zone) => [zone.id, zone]))

    return data.sectors.map((sector) => {
        const zone = zones.get(sector.zoneId)
        const districtCode = zone ? (districts.get(zone.districtId)?.code ?? '') : ''
        return {
            id: sector.id,
            name: sector.name,
            code: sector.code,
            pathCode: territoryPathCode(districtCode, zone?.code, sector.code),
            zoneCode: zone?.code ?? '',
            districtCode,
            zoneName: zone?.name ?? 'Zona sin asignar',
            districtName: zone
                ? (districts.get(zone.districtId)?.name ?? 'Distrito sin asignar')
                : 'Distrito sin asignar',
            polygon: normalizePolygon(sector.polygon),
            supervisorId: sector.supervisorId,
            supervisorName: sector.supervisorName,
        }
    })
}

export async function createMeetingType(
    apiClient: AxiosInstance,
    input: Pick<MeetingTypeOption, 'name' | 'codeSegment' | 'isActive' | 'isGeneral'>,
): Promise<MeetingTypeOption> {
    const response = await apiClient.post<ApiResponse<MeetingTypeOption>>('/meeting-types', input)
    return responseData(response.data, 'No fue posible crear el tipo de reunión')
}

export async function updateMeetingType(
    apiClient: AxiosInstance,
    id: number,
    input: Partial<Pick<MeetingTypeOption, 'name' | 'codeSegment' | 'isActive' | 'isGeneral'>>,
): Promise<MeetingTypeOption> {
    const response = await apiClient.put<ApiResponse<MeetingTypeOption>>(
        `/meeting-types/${id}`,
        input,
    )
    return responseData(response.data, 'No fue posible actualizar el tipo de reunión')
}

export async function deleteMeetingType(apiClient: AxiosInstance, id: number): Promise<void> {
    await apiClient.delete(`/meeting-types/${id}`)
}
