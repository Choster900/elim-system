import { resolveOccurrenceScope } from '../../../../services/access-scope.service'
import { getEnvelope } from '../../../../services/offering-reception.service'
import { requirePermission } from '../../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../../utils/http/api-response.util'
import { handleApiError } from '../../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../../utils/http/route-parameter.util'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.receive')
        const occurrenceId = getPositiveIntegerParam(event, 'occurrenceId')
        const scope = await resolveOccurrenceScope(auth)
        const data = await getEnvelope(occurrenceId, scope)
        return ApiResponseFactory.success(data, 'Sobre obtenido correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
