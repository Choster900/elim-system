import { getPermissionById } from '../../services/permission.service'
import { ApiResponseFactory } from '../../utils/response.util'
import { handleApiError } from '../../utils/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')!
        const data = await getPermissionById(id)
        return ApiResponseFactory.success(data, 'Permiso obtenido correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
