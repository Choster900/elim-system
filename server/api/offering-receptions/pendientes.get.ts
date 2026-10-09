import { resolveOccurrenceScope } from '../../services/access-scope.service'
import { getPendingEnvelopes } from '../../services/offering-reception.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { buildPaginationMeta, parsePaginationParams } from '../../utils/http/pagination.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { pendingEnvelopesFiltersSchema } from '../../validators/reception.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.receive')
        const filters = validateDto(pendingEnvelopesFiltersSchema, getQuery(event))
        const { page, limit, skip } = parsePaginationParams(event)
        const scope = await resolveOccurrenceScope(auth)
        const { items, zones, totalItems } = await getPendingEnvelopes(scope, filters, {
            skip,
            take: limit,
        })
        return ApiResponseFactory.success(
            { items, zones },
            'Sobres por recibir obtenidos correctamente',
            { pagination: buildPaginationMeta(page, limit, totalItems) },
        )
    } catch (error) {
        return handleApiError(event, error)
    }
})
