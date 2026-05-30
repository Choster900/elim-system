import { getQuery, getRequestURL } from 'h3'

const API_PREFIX = '/api'
const REQUEST_START_KEY = '__apiRequestStartedAtMs'
const LOG_SEPARATOR = '----------------------------------------------------------------'
const LOG_INDENT = '\t'

function printApiLog(label: 'API_REQUEST' | 'API_RESPONSE', payload: Record<string, unknown>) {
    const prettyPayload = JSON.stringify(payload, null, LOG_INDENT)
    const timestamp = new Date().toISOString()
    const lines = [LOG_SEPARATOR, `[${label}] ${timestamp}`, prettyPayload, LOG_SEPARATOR]

    console.log(lines.join('\n'))
}

export default defineNitroPlugin((nitroApp) => {
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
        return
    }

    nitroApp.hooks.hook('request', (event) => {
        if (!event.path.startsWith(API_PREFIX)) {
            return
        }

        ;(event.context as Record<string, unknown>)[REQUEST_START_KEY] = Date.now()

        const query = getQuery(event)
        const hasQuery = Object.keys(query).length > 0

        printApiLog('API_REQUEST', {
            method: event.node.req.method || 'GET',
            path: event.path,
            url: getRequestURL(event).toString(),
            query: hasQuery ? query : null,
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
