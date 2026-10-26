import { getTithers } from '../../services/tithe.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'finance.receive')
        const data = await getTithers()
        return ApiResponseFactory.success(data, 'Diezmadores obtenidos correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
