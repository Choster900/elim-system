import { getTerritoryLeaders } from '../../services/territory.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'territories.view')
        const data = await getTerritoryLeaders()
        return ApiResponseFactory.success(data, 'Líderes obtenidos correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
