import { resolveOccurrenceScope } from '../../services/access-scope.service'
import { getPendingOccurrences } from '../../services/meeting-occurrence.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

// Bandeja de pendientes: las fechas que ya pasaron y nadie capturó, dentro del
// alcance del usuario. Sincroniza antes de responder para que un supervisor que
// vuelve tras un mes vea sus fechas acumuladas sin depender de una tarea programada.
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
