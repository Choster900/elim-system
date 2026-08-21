import { deleteMember } from '../../services/member.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'members.update')
        const id = getPositiveIntegerParam(event, 'id')
        await deleteMember(id)
        return ApiResponseFactory.success(null, 'Miembro eliminado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
