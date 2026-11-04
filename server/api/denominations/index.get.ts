import { getDenominations } from '../../services/offering-reception.service'
import { requireReceptionAccess } from '../../utils/auth/reception-access.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requireReceptionAccess(event)
        const data = await getDenominations()
        return ApiResponseFactory.success(data, 'Denominaciones obtenidas correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
