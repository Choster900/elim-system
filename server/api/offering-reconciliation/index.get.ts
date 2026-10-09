import { resolveOccurrenceScope } from '../../services/access-scope.service'
import { getReconciliation } from '../../services/offering-reconciliation.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { reconciliationFiltersSchema } from '../../validators/reconciliation.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.audit')
        const filters = validateDto(reconciliationFiltersSchema, getQuery(event))
        const scope = await resolveOccurrenceScope(auth)
        const data = await getReconciliation(scope, filters)
        return ApiResponseFactory.success(data, 'Conciliación obtenida correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
