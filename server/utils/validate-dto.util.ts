import { createError } from 'h3'
import type { Schema } from 'joi'
import { ApiErrorCode } from '../types/api-response.types'

export function validateDto<T>(schema: Schema<T>, body: unknown): T {
    const { error, value } = schema.validate(body, { abortEarly: false })
    if (!error) return value as T

    const fields = error.details.reduce(
        (acc, { path, message }) => {
            const key = path.join('.')
            ;(acc[key] ??= []).push(message)
            return acc
        },
        {} as Record<string, string[]>,
    )

    throw createError({
        statusCode: 400,
        statusMessage: 'Los datos enviados no son válidos',
        data: { code: ApiErrorCode.VALIDATION_ERROR, fields },
    })
}
