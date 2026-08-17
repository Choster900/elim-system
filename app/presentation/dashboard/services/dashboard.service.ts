import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { DashboardPeriodDays, DashboardSummary } from '../interfaces/dashboard.interface'

export async function getDashboardSummary(
    apiClient: AxiosInstance,
    periodDays: DashboardPeriodDays,
    districtId: number | null,
    signal?: AbortSignal,
) {
    const response = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary', {
        params: {
            periodDays,
            ...(districtId === null ? {} : { districtId }),
        },
        signal,
    })

    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.details || 'No fue posible cargar el dashboard')
    }

    return response.data.data
}
