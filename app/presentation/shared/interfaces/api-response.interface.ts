export interface ApiError {
    code: string
    details?: string | null
    fields?: Record<string, string[]> | null
}

export interface PaginationMeta {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
}

export interface ApiMeta {
    timestamp?: string
    path?: string
    requestId?: string
    pagination?: PaginationMeta
}

export interface ApiResponse<T = unknown> {
    success: boolean
    message: string
    data: T | null
    error?: ApiError | null
    meta?: ApiMeta | null
}
