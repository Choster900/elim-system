export interface HttpClientError {
    name: 'HttpClientError'
    message: string
    status: number | null
    code: string | null
    details?: unknown
    endpoint?: string
}
