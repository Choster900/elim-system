export interface HttpClientContext {
    baseURL: string
    timeout: number
    isDev: boolean
    getAuthToken?: () => string | null | undefined
}
