import { getHeader, getQuery, getRequestURL, getResponseStatus, readBody, type H3Event } from 'h3'
import { getSanitizedRequestUrl, printApiLog } from '../utils/logging/api-log.util'

const API_PREFIX = '/api'
const LOG_CONTEXT_KEY = '__apiRequestLogContext'
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

interface RequestLogContext {
    startedAt: number
    method: string
    path: string
}

async function requestBody(event: H3Event, method: string) {
    if (!BODY_METHODS.has(method)) return null

    const contentType = getHeader(event, 'content-type')?.toLowerCase() ?? ''
    if (contentType.startsWith('multipart/form-data')) return '[multipart body omitted]'
    if (contentType.startsWith('application/octet-stream')) return '[binary body omitted]'

    try {
        return (await readBody(event)) ?? null
    } catch {
        return '[body unavailable]'
    }
}

export default defineNitroPlugin((nitroApp) => {
    if (process.env.NODE_ENV === 'production') return

    console.log('[api] Request/response logging enabled')

    nitroApp.hooks.hook('request', async (event) => {
        const path = getRequestURL(event).pathname
        if (path !== API_PREFIX && !path.startsWith(`${API_PREFIX}/`)) return

        const method = event.node.req.method || 'GET'
        ;(event.context as Record<string, unknown>)[LOG_CONTEXT_KEY] = {
            startedAt: Date.now(),
            method,
            path,
        } satisfies RequestLogContext

        printApiLog('API_REQUEST', {
            method,
            path,
            url: getSanitizedRequestUrl(event),
            query: Object.keys(getQuery(event)).length ? getQuery(event) : null,
            body: await requestBody(event, method),
        })
    })

    nitroApp.hooks.hook('afterResponse', (event, response) => {
        const context = (event.context as Record<string, unknown>)[LOG_CONTEXT_KEY] as
            | RequestLogContext
            | undefined
        if (!context) return

        const status = getResponseStatus(event)
        printApiLog(
            'API_RESPONSE',
            {
                method: context.method,
                path: context.path,
                status,
                durationMs: Date.now() - context.startedAt,
                response: response?.body ?? null,
            },
            status >= 500 ? 'error' : status >= 400 ? 'warn' : 'log',
        )
    })
})
