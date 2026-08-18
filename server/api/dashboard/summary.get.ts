import { getQuery } from 'h3'
import { resolveOccurrenceScope } from '../../services/access-scope.service'
import { getDashboardSummary } from '../../services/dashboard.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { dashboardQuerySchema } from '../../validators/dashboard.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'dashboard.view')
        const query = validateDto(dashboardQuerySchema, getQuery(event))
        const scope = await resolveOccurrenceScope(auth)
        const data = await getDashboardSummary(query, scope.seesAll ? undefined : scope.sectorIds)

        return ApiResponseFactory.success(data, 'Resumen del dashboard obtenido correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
