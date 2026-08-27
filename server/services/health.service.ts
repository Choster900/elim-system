import { createError } from 'h3'
import { prisma } from '../database/prisma'
import { ApiErrorCode } from '../types/api-response.types'

export interface HealthResponse {
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

export async function createHealthResponse(appName: string): Promise<HealthResponse> {
    const databaseCheckStartedAt = performance.now()

    try {
        await prisma.$queryRaw`SELECT 1`
    } catch {
        throw createError({
            statusCode: 503,
            message: 'No fue posible conectar con la base de datos',
            data: { code: ApiErrorCode.SERVICE_UNAVAILABLE },
        })
    }

    return {
        status: 'ok',
        service: 'nuxt-nitro-api',
        appName,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
            status: 'ok',
            responseTimeMs: Math.round(performance.now() - databaseCheckStartedAt),
        },
    }
}
