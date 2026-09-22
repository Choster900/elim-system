import { getRolesForManagement } from '../../services/role.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'roles.view')
        const data = await getRolesForManagement()
        return ApiResponseFactory.success(data, 'Roles obtenidos correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
