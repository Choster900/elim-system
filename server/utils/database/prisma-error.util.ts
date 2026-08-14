import { createError } from 'h3'
import { Prisma } from '@prisma/client'
import { ApiErrorCode } from '../../types/api-response.types'

const PRISMA_ERROR_MAP: Record<
    string,
    { statusCode: number; message: string; code: ApiErrorCode }
> = {
    P2002: {
        statusCode: 409,
        message: 'El recurso ya existe',
        code: ApiErrorCode.RESOURCE_ALREADY_EXISTS,
    },
    P2025: {
        statusCode: 404,
        message: 'Recurso no encontrado',
        code: ApiErrorCode.RESOURCE_NOT_FOUND,
    },
    P2003: {
        statusCode: 409,
        message: 'El recurso tiene registros asociados y no puede eliminarse',
        code: ApiErrorCode.BUSINESS_RULE_ERROR,
    },
}

export function mapPrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const mapped = PRISMA_ERROR_MAP[error.code]
        if (mapped) {
            throw createError({ ...mapped, data: { code: mapped.code } })
        }
    }
    throw error as Error
}
