import { deleteMeetingType } from '../../services/meeting.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'meeting-types.manage')
        await deleteMeetingType(getPositiveIntegerParam(event, 'id'))
        return ApiResponseFactory.success(null, 'Tipo de reunión eliminado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
