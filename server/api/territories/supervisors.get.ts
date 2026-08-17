import { getSectorSupervisors } from '../../services/territory.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'territories.view')
        const data = await getSectorSupervisors()
        return ApiResponseFactory.success(data, 'Supervisores obtenidos correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
