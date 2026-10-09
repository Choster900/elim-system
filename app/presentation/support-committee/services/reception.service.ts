import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type {
    Denomination,
    Envelope,
    EnvelopeDetail,
    PendingEnvelopesPage,
    PendingEnvelopesParams,
    ReceiveEnvelopeInput,
    ReceptionComparison,
    ReceptionCountInput,
    ReceptionFilters,
    ReceptionRecord,
} from '../interfaces/reception.interface'

function responseData<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null || response.data === undefined) {
        throw new Error(response.error?.details || response.message || fallbackMessage)
    }
    return response.data
}

function envelopePath(occurrenceId: number) {
    return `/offering-receptions/sobres/${occurrenceId}`
}

export async function getPendingEnvelopes(
    apiClient: AxiosInstance,
    params: PendingEnvelopesParams,
    signal?: AbortSignal,
): Promise<PendingEnvelopesPage> {
    const response = await apiClient.get<
        ApiResponse<{ items: Envelope[]; zones: PendingEnvelopesPage['zones'] }>
    >('/offering-receptions/pendientes', {
        params: {
            page: params.page,
            limit: params.limit,
            ...(params.search ? { search: params.search } : {}),
            ...(params.zoneId ? { zoneId: params.zoneId } : {}),
        },
        signal,
    })
    const data = responseData(response.data, 'No fue posible cargar los sobres por recibir')
    const totalItems = response.data.meta?.pagination?.totalItems ?? data.items.length
    return {
        ...data,
        pagination: response.data.meta?.pagination ?? {
            page: params.page,
            limit: params.limit,
            totalItems,
            totalPages: Math.ceil(totalItems / params.limit),
            hasNextPage: false,
            hasPreviousPage: params.page > 1,
        },
    }
}

export async function getReceptions(
    apiClient: AxiosInstance,
    filters: ReceptionFilters = {},
    signal?: AbortSignal,
): Promise<ReceptionRecord[]> {
    const response = await apiClient.get<ApiResponse<ReceptionRecord[]>>('/offering-receptions', {
        params: filters,
        signal,
    })
    return responseData(response.data, 'No fue posible cargar los sobres recibidos')
}

export async function getEnvelope(
    apiClient: AxiosInstance,
    occurrenceId: number,
    signal?: AbortSignal,
): Promise<EnvelopeDetail> {
    const response = await apiClient.get<ApiResponse<EnvelopeDetail>>(envelopePath(occurrenceId), {
        signal,
    })
    return responseData(response.data, 'No fue posible cargar el sobre')
}

export async function compareEnvelope(
    apiClient: AxiosInstance,
    occurrenceId: number,
    input: ReceptionCountInput,
    signal?: AbortSignal,
): Promise<ReceptionComparison> {
    const response = await apiClient.post<ApiResponse<ReceptionComparison>>(
        `${envelopePath(occurrenceId)}/comparar`,
        input,
        { signal },
    )
    return responseData(response.data, 'No fue posible comparar el conteo')
}

export async function receiveEnvelope(
    apiClient: AxiosInstance,
    occurrenceId: number,
    input: ReceiveEnvelopeInput,
): Promise<ReceptionRecord> {
    const response = await apiClient.post<ApiResponse<ReceptionRecord>>(
        envelopePath(occurrenceId),
        input,
    )
    return responseData(response.data, 'No fue posible recibir el sobre')
}

export async function correctReception(
    apiClient: AxiosInstance,
    occurrenceId: number,
    input: ReceiveEnvelopeInput,
): Promise<ReceptionRecord> {
    const response = await apiClient.put<ApiResponse<ReceptionRecord>>(
        envelopePath(occurrenceId),
        input,
    )
    return responseData(response.data, 'No fue posible corregir el conteo')
}

export async function getDenominations(
    apiClient: AxiosInstance,
    signal?: AbortSignal,
): Promise<Denomination[]> {
    const response = await apiClient.get<ApiResponse<Denomination[]>>('/denominations', {
        signal,
    })
    return responseData(response.data, 'No fue posible cargar los billetes y monedas')
}
