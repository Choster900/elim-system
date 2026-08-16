import { getMeetingTypes } from '../../services/meeting.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'meetings.view')
        const data = await getMeetingTypes()
        return ApiResponseFactory.success(data, 'Tipos de reunión obtenidos correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
