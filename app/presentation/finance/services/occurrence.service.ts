import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type {
    AttendanceTypeOption,
    BulkRecordEntry,
    OccurrenceFilters,
    OccurrenceRecord,
    OfferingCategoryOption,
    RecordOccurrenceInput,
} from '../interfaces/occurrence.interface'

function responseData<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null || response.data === undefined) {
        throw new Error(response.error?.details || response.message || fallbackMessage)
    }
    return response.data
}

export async function getPendingOccurrences(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<OccurrenceRecord[]> {
    const response = await apiClient.get<ApiResponse<OccurrenceRecord[]>>('/offerings/pendientes', {
        signal,
    })
    return responseData(response.data, 'No fue posible cargar los pendientes')
}

export async function getOccurrences(
    apiClient: AxiosInstance,
    filters: OccurrenceFilters = {},
    signal?: AbortSignal,
): Promise<OccurrenceRecord[]> {
    const response = await apiClient.get<ApiResponse<OccurrenceRecord[]>>(
        '/offerings/ocurrencias',
        { params: filters, signal },
    )
    return responseData(response.data, 'No fue posible cargar el historial')
}

export async function getOccurrence(
    apiClient: AxiosInstance,
    id: number,
    signal?: AbortSignal,
): Promise<OccurrenceRecord> {
    const response = await apiClient.get<ApiResponse<OccurrenceRecord>>(
        `/offerings/ocurrencias/${id}`,
        { signal },
    )
    return responseData(response.data, 'No fue posible cargar la fecha')
}

export async function getMeetingHistory(
    apiClient: AxiosInstance,
    meetingId: number,
    signal?: AbortSignal,
): Promise<OccurrenceRecord[]> {
    const response = await apiClient.get<ApiResponse<OccurrenceRecord[]>>(
        `/meetings/${meetingId}/ocurrencias`,
        { signal },
    )
    return responseData(response.data, 'No fue posible cargar el historial de la reunión')
}

export async function recordOccurrence(
    apiClient: AxiosInstance,
    id: number,
    input: RecordOccurrenceInput,
): Promise<OccurrenceRecord> {
    const response = await apiClient.post<ApiResponse<OccurrenceRecord>>(
        `/offerings/ocurrencias/${id}/registrar`,
        input,
    )
    return responseData(response.data, 'No fue posible registrar la fecha')
}

export async function recordOccurrencesBulk(
    apiClient: AxiosInstance,
    entries: BulkRecordEntry[],
): Promise<OccurrenceRecord[]> {
    const response = await apiClient.post<ApiResponse<OccurrenceRecord[]>>(
        '/offerings/ocurrencias/registrar-lote',
        { entries },
    )
    return responseData(response.data, 'No fue posible registrar las fechas')
}

export async function updateOccurrence(
    apiClient: AxiosInstance,
    id: number,
    input: Partial<RecordOccurrenceInput>,
): Promise<OccurrenceRecord> {
    const response = await apiClient.put<ApiResponse<OccurrenceRecord>>(
        `/offerings/ocurrencias/${id}`,
        input,
    )
    return responseData(response.data, 'No fue posible corregir la fecha')
}

export async function getAttendanceTypes(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<AttendanceTypeOption[]> {
    const response = await apiClient.get<ApiResponse<AttendanceTypeOption[]>>('/attendance-types', {
        signal,
    })
    return responseData(response.data, 'No fue posible cargar los tipos de asistencia')
}

export async function getOfferingCategories(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<OfferingCategoryOption[]> {
    const response = await apiClient.get<ApiResponse<OfferingCategoryOption[]>>(
        '/offering-categories',
        { signal },
    )
    return responseData(response.data, 'No fue posible cargar las categorías de ofrenda')
}
