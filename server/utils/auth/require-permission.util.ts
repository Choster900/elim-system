import { createError, type H3Event } from 'h3'
import { ApiErrorCode } from '../../types/api-response.types'
import { requireAuth } from './require-auth.util'

const SYSTEM_PERMISSION_CODE = 'system.manage'

export function requirePermission(event: H3Event, permissionCode: string | string[]) {
    const auth = requireAuth(event)
    const acceptedCodes = Array.isArray(permissionCode) ? permissionCode : [permissionCode]
    const isAllowed =
        auth.permissions.includes(SYSTEM_PERMISSION_CODE) ||
        acceptedCodes.some((code) => auth.permissions.includes(code))

    if (!isAllowed) {
        throw createError({
            statusCode: 403,
            message: `Permiso requerido: ${acceptedCodes.join(' o ')}`,
            data: { code: ApiErrorCode.FORBIDDEN },
        })
    }

    return auth
}
