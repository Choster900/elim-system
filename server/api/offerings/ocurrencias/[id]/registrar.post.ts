import { resolveOccurrenceScope } from '../../../../services/access-scope.service'
import { recordOccurrence } from '../../../../services/meeting-occurrence.service'
import { requirePermission } from '../../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../../utils/http/api-response.util'
import { handleApiError } from '../../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../../utils/http/route-parameter.util'
import { validateDto } from '../../../../utils/validation/dto-validation.util'
import { recordOccurrenceSchema } from '../../../../validators/offering.validator'

// Registrar es una sola vez. Corregir después exige finance.manage, que es lo que
// impide al líder reescribir su propio registro.
export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.record')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(recordOccurrenceSchema, await readBody(event))
        const scope = await resolveOccurrenceScope(auth)
        const data = await recordOccurrence(id, dto, scope, auth.userId)
        return ApiResponseFactory.success(data, 'Fecha registrada correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
