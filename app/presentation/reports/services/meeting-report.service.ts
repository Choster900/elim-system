import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { MeetingReport, ReportDateRange } from '../interfaces/meeting-report.interface'

export async function getMeetingReport(
    apiClient: AxiosInstance,
    range: ReportDateRange,
    signal?: AbortSignal,
) {
    const response = await apiClient.get<ApiResponse<MeetingReport>>('/reports/meetings', {
        params: { from: range.from, to: range.to },
        signal,
    })

    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.details || 'No fue posible generar el reporte')
    }

    return response.data.data
}
