import { getHeader, getRequestIP, type H3Event } from 'h3'

export interface RequestMetadata {
    userAgent: string | null
    ipAddress: string | null
}

export function getRequestMetadata(event: H3Event): RequestMetadata {
    return {
        userAgent: getHeader(event, 'user-agent') ?? null,
        ipAddress: getRequestIP(event, { xForwardedFor: true }) ?? null,
    }
}
