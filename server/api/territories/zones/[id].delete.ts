import { deleteZone } from '../../../services/territory.service'
import { requirePermission } from '../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../utils/http/route-parameter.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'territories.manage')
        const id = getPositiveIntegerParam(event, 'id')
        await deleteZone(id)
        return ApiResponseFactory.success(null, 'Zona eliminada correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
