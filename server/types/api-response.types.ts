export enum ApiErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
    RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
    BUSINESS_RULE_ERROR = 'BUSINESS_RULE_ERROR',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    INVALID_TOKEN = 'INVALID_TOKEN',
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

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
