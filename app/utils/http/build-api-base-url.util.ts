interface BuildApiBaseUrlOptions {
    apiUrl?: string
    appUrl?: string
    requestOrigin?: string
}

function normalizeApiBaseUrl(url?: string): string {
    const value = String(url || '').trim()
    if (!value) {
        return ''
    }

    try {
        const parsedUrl = new URL(value)
        const currentPath = parsedUrl.pathname.replace(/\/+$/, '')
        parsedUrl.pathname = currentPath.endsWith('/api') ? currentPath : `${currentPath}/api`
        return parsedUrl.toString().replace(/\/$/, '')
    } catch {
        return ''
    }
}

export function buildApiBaseUrl(options: BuildApiBaseUrlOptions): string {
    if (import.meta.client) {
        return '/api'
    }

    const apiBaseUrl = normalizeApiBaseUrl(options.apiUrl)
    if (apiBaseUrl) {
        return apiBaseUrl
    }

    const requestBasedUrl = normalizeApiBaseUrl(options.requestOrigin)
    if (requestBasedUrl) {
        return requestBasedUrl
    }

    const appBasedUrl = normalizeApiBaseUrl(options.appUrl)
    if (appBasedUrl) {
        return appBasedUrl
    }

    return '/api'
}
