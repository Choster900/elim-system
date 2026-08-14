import { deletePermission } from '../../services/permission.service'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'

export default defineEventHandler(async (event) => {
    try {
        const id = getPositiveIntegerParam(event, 'id')
        await deletePermission(id)
        return ApiResponseFactory.success(null, 'Permiso eliminado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
