export interface HealthcheckResponse {
    status: 'ok'
    service: string
    appName: string
    timestamp: string
    uptime: number
    database: {
        status: 'ok'
        responseTimeMs: number
    }
}
