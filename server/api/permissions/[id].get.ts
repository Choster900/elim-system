import { getPermissionById } from '../../services/permission.service'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')!
        const data = await getPermissionById(id)
        return ApiResponseFactory.success(data, 'Permiso obtenido correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
