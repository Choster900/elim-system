export interface HealthcheckResponse {
    status: 'ok'
    service: string
    appName: string
    timestamp: string
    uptime: number
}
