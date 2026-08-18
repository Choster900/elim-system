import { resolveOccurrenceScope } from '../../../../services/access-scope.service'
import { getOccurrenceById } from '../../../../services/meeting-occurrence.service'
import { requirePermission } from '../../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../../utils/http/api-response.util'
import { handleApiError } from '../../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../../utils/http/route-parameter.util'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.view')
        const id = getPositiveIntegerParam(event, 'id')
        const scope = await resolveOccurrenceScope(auth)
        const data = await getOccurrenceById(id, scope)
        return ApiResponseFactory.success(data, 'Ocurrencia obtenida correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
