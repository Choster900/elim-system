import { resolveOccurrenceScope } from '../../services/access-scope.service'
import { getReceptions } from '../../services/offering-reception.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { receptionFiltersSchema } from '../../validators/reception.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.receive')
        const filters = validateDto(receptionFiltersSchema, getQuery(event))
        const scope = await resolveOccurrenceScope(auth)
        const data = await getReceptions(scope, filters)
        return ApiResponseFactory.success(data, 'Sobres recibidos obtenidos correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
