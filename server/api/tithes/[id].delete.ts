import { deleteTithe } from '../../services/tithe.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'finance.receive')
        const id = getPositiveIntegerParam(event, 'id')
        const data = await deleteTithe(id)
        return ApiResponseFactory.success(data, 'Diezmo eliminado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
