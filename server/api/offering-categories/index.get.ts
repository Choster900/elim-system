import { getOfferingCategories } from '../../services/offering.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'finance.view')
        const data = await getOfferingCategories()
        return ApiResponseFactory.success(data, 'Categorías de ofrenda obtenidas correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
