import { resolveOccurrenceScope } from '../../../../services/access-scope.service'
import { closeDiscrepancy } from '../../../../services/offering-reconciliation.service'
import { requirePermission } from '../../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../../utils/http/api-response.util'
import { handleApiError } from '../../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../../utils/http/route-parameter.util'
import { validateDto } from '../../../../utils/validation/dto-validation.util'
import { closeDiscrepancySchema } from '../../../../validators/reconciliation.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.audit')
        const occurrenceId = getPositiveIntegerParam(event, 'occurrenceId')
        const dto = validateDto(closeDiscrepancySchema, await readBody(event))
        const scope = await resolveOccurrenceScope(auth)
        const data = await closeDiscrepancy(occurrenceId, dto.notes, scope, auth.userId)
        return ApiResponseFactory.success(data, 'Diferencia marcada como revisada')
    } catch (error) {
        return handleApiError(event, error)
    }
})
