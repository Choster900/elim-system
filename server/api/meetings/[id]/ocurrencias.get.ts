import { resolveOccurrenceScope } from '../../../services/access-scope.service'
import { getOccurrences } from '../../../services/meeting-occurrence.service'
import { requirePermission } from '../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../utils/http/route-parameter.util'

// Historial completo de una reunión: cada fecha, su asistencia y su ofrenda.
export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.view')
        const meetingId = getPositiveIntegerParam(event, 'id')
        const scope = await resolveOccurrenceScope(auth)
        const data = await getOccurrences(scope, { meetingId })
        return ApiResponseFactory.success(data, 'Historial obtenido correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
