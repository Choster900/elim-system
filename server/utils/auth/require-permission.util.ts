import { createError, type H3Event } from 'h3'
import { ApiErrorCode } from '../../types/api-response.types'
import { requireAuth } from './require-auth.util'

const SYSTEM_PERMISSION_CODE = 'system.manage'

export function requirePermission(event: H3Event, permissionCode: string) {
    const auth = requireAuth(event)
    const isAllowed =
        auth.permissions.includes(SYSTEM_PERMISSION_CODE) ||
        auth.permissions.includes(permissionCode)

    if (!isAllowed) {
        throw createError({
            statusCode: 403,
            message: `Permiso requerido: ${permissionCode}`,
            data: { code: ApiErrorCode.FORBIDDEN },
        })
    }

    return auth
}
