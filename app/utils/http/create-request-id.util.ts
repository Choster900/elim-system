function fallbackRequestId(): string {
    const random = Math.random().toString(36).slice(2, 10)
    return `req_${Date.now()}_${random}`
}

export function createRequestId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }

    return fallbackRequestId()
}
