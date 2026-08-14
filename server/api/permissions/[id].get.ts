import { getPermissionById } from '../../services/permission.service'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'permissions.view')
        const id = getPositiveIntegerParam(event, 'id')
        const data = await getPermissionById(id)
        return ApiResponseFactory.success(data, 'Permiso obtenido correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
