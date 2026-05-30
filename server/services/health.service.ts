export interface HealthResponse {
    status: 'ok'
    service: string
    appName: string
    timestamp: string
    uptime: number
}

export function createHealthResponse(appName: string): HealthResponse {
    return {
        status: 'ok',
        service: 'nuxt-nitro-api',
        appName,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    }
}
