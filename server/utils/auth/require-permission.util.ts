import { createError, type H3Event } from 'h3'
import { ApiErrorCode } from '../../types/api-response.types'
import type { AuthenticatedUserContext } from '../../types/auth.types'
import { requireAuth } from './require-auth.util'

const SYSTEM_PERMISSION_CODE = 'system.manage'

export function hasPermission(
    auth: Pick<AuthenticatedUserContext, 'permissions'>,
    permissionCode: string,
) {
    return (
        auth.permissions.includes(SYSTEM_PERMISSION_CODE) ||
        auth.permissions.includes(permissionCode)
    )
}

export function requirePermission(event: H3Event, permissionCode: string | string[]) {
    const auth = requireAuth(event)
    const acceptedCodes = Array.isArray(permissionCode) ? permissionCode : [permissionCode]
    const isAllowed = acceptedCodes.some((code) => hasPermission(auth, code))

    if (!isAllowed) {
        throw createError({
            statusCode: 403,
            message: `Permiso requerido: ${acceptedCodes.join(' o ')}`,
            data: { code: ApiErrorCode.FORBIDDEN },
        })
    }

    return auth
}
