import { resolveOccurrenceScope } from '../../services/access-scope.service'
import { getPendingEnvelopes } from '../../services/offering-reception.service'
import {
    RECEPTION_GENERAL_SERVICES_PERMISSION,
    RECEPTION_PENDING_PERMISSION,
    requireReceptionAccess,
} from '../../utils/auth/reception-access.util'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { buildPaginationMeta, parsePaginationParams } from '../../utils/http/pagination.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { pendingEnvelopesFiltersSchema } from '../../validators/reception.validator'

export default defineEventHandler(async (event) => {
    try {
        const { auth } = requireReceptionAccess(event)
        const filters = validateDto(pendingEnvelopesFiltersSchema, getQuery(event))
        if (filters.kind !== 'generales') requirePermission(event, RECEPTION_PENDING_PERMISSION)
        if (filters.kind !== 'lideres') {
            requirePermission(event, RECEPTION_GENERAL_SERVICES_PERMISSION)
        }
        const { page, limit, skip } = parsePaginationParams(event)
        const scope = await resolveOccurrenceScope(auth)
        const { items, districts, zones, sectors, totalItems } = await getPendingEnvelopes(
            scope,
            filters,
            { skip, take: limit },
        )
        return ApiResponseFactory.success(
            { items, districts, zones, sectors },
            'Sobres por recibir obtenidos correctamente',
            { pagination: buildPaginationMeta(page, limit, totalItems) },
        )
    } catch (error) {
        return handleApiError(event, error)
    }
})
