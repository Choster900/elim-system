import { getAllPermissions } from '../../services/permission.service'
import { ApiResponseFactory } from '../../utils/response.util'
import { handleApiError } from '../../utils/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const data = await getAllPermissions()
        return ApiResponseFactory.success(data, 'Permisos obtenidos correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
