import { resolveOccurrenceScope } from '../../services/access-scope.service'
import { getPendingOccurrences } from '../../services/meeting-occurrence.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.view')
        const scope = await resolveOccurrenceScope(auth)
        const data = await getPendingOccurrences(scope)
        return ApiResponseFactory.success(data, 'Pendientes obtenidos correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
