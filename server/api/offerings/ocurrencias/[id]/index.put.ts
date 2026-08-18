import { resolveOccurrenceScope } from '../../../../services/access-scope.service'
import { updateOccurrence } from '../../../../services/meeting-occurrence.service'
import { requirePermission } from '../../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../../utils/http/api-response.util'
import { handleApiError } from '../../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../../utils/http/route-parameter.util'
import { validateDto } from '../../../../utils/validation/dto-validation.util'
import { updateOccurrenceSchema } from '../../../../validators/offering.validator'

// Corrección de una fecha ya registrada; queda registrado quién la hizo.
export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.manage')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(updateOccurrenceSchema, await readBody(event))
        const scope = await resolveOccurrenceScope(auth)
        const data = await updateOccurrence(id, dto, scope, auth.userId)
        return ApiResponseFactory.success(data, 'Fecha corregida correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
