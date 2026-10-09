import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type {
    EnvelopeReview,
    ReconciliationFilters,
    ReconciliationSummary,
} from '../interfaces/reconciliation.interface'

function responseData<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null || response.data === undefined) {
        throw new Error(response.error?.details || response.message || fallbackMessage)
    }
    return response.data
}

export async function getReconciliation(
    apiClient: AxiosInstance,
    filters: ReconciliationFilters,
    signal?: AbortSignal,
): Promise<ReconciliationSummary> {
    const response = await apiClient.get<ApiResponse<ReconciliationSummary>>(
        '/offering-reconciliation',
        { params: filters, signal },
    )
    return responseData(response.data, 'No fue posible cargar la conciliación')
}

export async function getEnvelopeReview(
    apiClient: AxiosInstance,
    occurrenceId: number,
    signal?: AbortSignal,
): Promise<EnvelopeReview> {
    const response = await apiClient.get<ApiResponse<EnvelopeReview>>(
        `/offering-reconciliation/sobres/${occurrenceId}`,
        { signal },
    )
    return responseData(response.data, 'No fue posible cargar el sobre')
}

export async function closeDiscrepancy(
    apiClient: AxiosInstance,
    occurrenceId: number,
    notes: string,
): Promise<EnvelopeReview> {
    const response = await apiClient.post<ApiResponse<EnvelopeReview>>(
        `/offering-reconciliation/sobres/${occurrenceId}/cerrar`,
        { notes },
    )
    return responseData(response.data, 'No fue posible cerrar la diferencia')
}
