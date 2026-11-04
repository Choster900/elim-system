import { resolveOccurrenceScope } from '../../../../services/access-scope.service'
import { getEnvelope } from '../../../../services/offering-reception.service'
import { requireReceptionAccess } from '../../../../utils/auth/reception-access.util'
import { ApiResponseFactory } from '../../../../utils/http/api-response.util'
import { handleApiError } from '../../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../../utils/http/route-parameter.util'

export default defineEventHandler(async (event) => {
    try {
        const { auth, access } = requireReceptionAccess(event)
        const occurrenceId = getPositiveIntegerParam(event, 'occurrenceId')
        const scope = await resolveOccurrenceScope(auth)
        const data = await getEnvelope(occurrenceId, scope, access)
        return ApiResponseFactory.success(data, 'Sobre obtenido correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
