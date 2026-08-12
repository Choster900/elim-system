import { getHeader, getQuery, readBody, type H3Event } from 'h3'
import { getSanitizedRequestUrl, printApiLog } from '../utils/logging/api-log.util'

const API_PREFIX = '/api'
const REQUEST_START_KEY = '__apiRequestStartedAtMs'
const OMITTED_MULTIPART_BODY = '[multipart body omitted]'
const OMITTED_BINARY_BODY = '[binary body omitted]'
const UNAVAILABLE_BODY = '[body unavailable]'
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

async function getRequestBodyForLog(event: H3Event, method: string) {
    if (!BODY_METHODS.has(method)) {
        return null
    }

    const contentType = getHeader(event, 'content-type')?.toLowerCase() ?? ''
    if (contentType.startsWith('multipart/form-data')) {
        return OMITTED_MULTIPART_BODY
    }
    if (contentType.startsWith('application/octet-stream')) {
        return OMITTED_BINARY_BODY
    }

    try {
        return (await readBody(event)) ?? null
    } catch {
        return UNAVAILABLE_BODY
    }
}

export default defineNitroPlugin((nitroApp) => {
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
        return
    }

    nitroApp.hooks.hook('request', async (event) => {
        if (!event.path.startsWith(API_PREFIX)) {
            return
        }

        ;(event.context as Record<string, unknown>)[REQUEST_START_KEY] = Date.now()

        const method = event.node.req.method || 'GET'
        const query = getQuery(event)
        const hasQuery = Object.keys(query).length > 0
        const body = await getRequestBodyForLog(event, method)

        printApiLog('API_REQUEST', {
            method,
            path: event.path,
            url: getSanitizedRequestUrl(event),
            query: hasQuery ? query : null,
            body,
        })
    })

    nitroApp.hooks.hook('afterResponse', (event, response) => {
        if (!event.path.startsWith(API_PREFIX)) {
            return
        }

        const startedAt = (event.context as Record<string, unknown>)[REQUEST_START_KEY]
        const durationMs = typeof startedAt === 'number' ? Date.now() - startedAt : null
        const responseBody = response && 'body' in response ? response.body : null

        printApiLog('API_RESPONSE', {
            method: event.node.req.method || 'GET',
            path: event.path,
            status: event.node.res.statusCode,
            durationMs,
            response: responseBody,
        })
    })
})
