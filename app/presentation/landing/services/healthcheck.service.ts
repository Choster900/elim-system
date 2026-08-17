import type { AxiosInstance } from 'axios'
import type { HealthcheckResponse } from '../interfaces/healthcheck-response.interface'

export async function getHealthcheck(
    client: AxiosInstance,
    signal?: AbortSignal,
): Promise<HealthcheckResponse> {
    const response = await client.get<HealthcheckResponse>('/healthcheck', { signal })
    return response.data
}
