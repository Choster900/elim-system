import { getQuery } from 'h3'
import type { H3Event } from 'h3'
import type { PaginationMeta } from '../types/api-response.types'

export interface PaginationParams {
    page: number
    limit: number
    skip: number
}

export function parsePaginationParams(event: H3Event): PaginationParams {
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10))
    return { page, limit, skip: (page - 1) * limit }
}

export function buildPaginationMeta(
    page: number,
    limit: number,
    totalItems: number,
): PaginationMeta {
    const totalPages = Math.ceil(totalItems / limit)
    return {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    }
}
