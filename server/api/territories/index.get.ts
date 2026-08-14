import { getTerritoryHierarchy } from '../../services/territory.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'territories.view')
        const data = await getTerritoryHierarchy()
        return ApiResponseFactory.success(data, 'Jerarquía territorial obtenida correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
