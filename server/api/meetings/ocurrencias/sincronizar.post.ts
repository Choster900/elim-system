import { syncOccurrences } from '../../../services/meeting-occurrence.service'
import { requirePermission } from '../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'finance.manage')
        const data = await syncOccurrences()
        return ApiResponseFactory.success(data, 'Ocurrencias sincronizadas correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
