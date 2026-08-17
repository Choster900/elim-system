import { getUserCatalog } from '../../services/user.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'users.view')
        return ApiResponseFactory.success(
            await getUserCatalog(),
            'Catálogo de usuarios obtenido correctamente',
        )
    } catch (error) {
        return handleApiError(event, error)
    }
})
