import { getMembers } from '../../services/member.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'members.view')
        const data = await getMembers()
        return ApiResponseFactory.success(data, 'Miembros obtenidos correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
