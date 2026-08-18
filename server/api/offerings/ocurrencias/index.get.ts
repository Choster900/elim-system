import { resolveOccurrenceScope } from '../../../services/access-scope.service'
import { getOccurrences } from '../../../services/meeting-occurrence.service'
import { requirePermission } from '../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { occurrenceFiltersSchema } from '../../../validators/offering.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.view')
        const filters = validateDto(occurrenceFiltersSchema, getQuery(event))
        const scope = await resolveOccurrenceScope(auth)
        const data = await getOccurrences(scope, filters)
        return ApiResponseFactory.success(data, 'Ocurrencias obtenidas correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
