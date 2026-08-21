import { getMemberCatalogs } from '../../services/member.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'members.view')
        const data = await getMemberCatalogs()
        return ApiResponseFactory.success(data, 'Catálogos de miembros obtenidos correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
