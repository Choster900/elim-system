import { getRequestURL, type H3Event } from 'h3'

const LOG_SEPARATOR = '-'.repeat(64)
const REDACTED_VALUE = '[REDACTED]'
const MAX_LOG_STRING_LENGTH = 2_000

type ApiLogLabel = 'API_REQUEST' | 'API_RESPONSE'
type ApiLogLevel = 'log' | 'warn' | 'error'

export function isSensitiveLogKey(key: string) {
    const normalizedKey = key.replace(/[^a-z0-9]/gi, '').toLowerCase()

    return (
        ['password', 'passwd', 'secret', 'credential'].some((part) =>
            normalizedKey.includes(part),
        ) ||
        ['pwd', 'authorization', 'cookie', 'setcookie', 'jwt', 'apikey'].includes(normalizedKey) ||
        normalizedKey.endsWith('token') ||
        normalizedKey.endsWith('tokenhash') ||
        normalizedKey.endsWith('privatekey')
    )
}

export function truncateLogString(value: string, maxLength = MAX_LOG_STRING_LENGTH) {
    if (value.length <= maxLength) {
        return value
    }

    return `${value.slice(0, maxLength)}...[truncated ${value.length - maxLength} chars]`
}

export function sanitizeForLog(value: unknown, seen = new WeakSet<object>()): unknown {
    if (typeof value === 'string') {
        return truncateLogString(value)
    }

    if (typeof value === 'bigint') {
        return value.toString()
    }

    if (typeof value !== 'object' || value === null) {
        return value
    }

    if (value instanceof Error) {
        const error = value as Error & {
            statusCode?: number
            statusMessage?: string
            data?: unknown
        }

        seen.add(value)
        const sanitizedError = {
            name: error.name,
            message: truncateLogString(error.message),
            statusCode: error.statusCode,
            statusMessage: error.statusMessage,
            data: sanitizeForLog(error.data, seen),
            stack: error.stack ? truncateLogString(error.stack) : undefined,
        }
        seen.delete(value)
        return sanitizedError
    }

    if (value instanceof Date) {
        return value.toISOString()
    }

    if (value instanceof Uint8Array) {
        return `[binary data: ${value.byteLength} bytes]`
    }

    if (seen.has(value)) {
        return '[circular reference]'
    }

    seen.add(value)

    if (Array.isArray(value)) {
        const sanitizedArray = value.map((item) => sanitizeForLog(item, seen))
        seen.delete(value)
        return sanitizedArray
    }

    const sanitizedObject = Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [
            key,
            isSensitiveLogKey(key) ? REDACTED_VALUE : sanitizeForLog(nestedValue, seen),
        ]),
    )
    seen.delete(value)
    return sanitizedObject
}

export function getSanitizedRequestUrl(event: H3Event) {
    const url = getRequestURL(event)

    for (const key of new Set(url.searchParams.keys())) {
        if (isSensitiveLogKey(key)) {
            url.searchParams.set(key, REDACTED_VALUE)
        }
    }

    return url.toString()
}

export function printApiLog(
    label: ApiLogLabel,
    payload: Record<string, unknown>,
    level: ApiLogLevel = 'log',
) {
    const prettyPayload = JSON.stringify(sanitizeForLog(payload), null, '\t')
    const timestamp = new Date().toISOString()
    const lines = [LOG_SEPARATOR, `[${label}] ${timestamp}`, prettyPayload, LOG_SEPARATOR]

    console[level](lines.join('\n'))
}
