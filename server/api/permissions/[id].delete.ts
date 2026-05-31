import { deletePermission } from '../../services/permission.service'
import { ApiResponseFactory } from '../../utils/response.util'
import { handleApiError } from '../../utils/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')!
        await deletePermission(id)
        return ApiResponseFactory.success(null, 'Permiso eliminado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
