import { resolveOccurrenceScope } from '../../../../services/access-scope.service'
import { compareEnvelope } from '../../../../services/offering-reception.service'
import { requireReceptionAccess } from '../../../../utils/auth/reception-access.util'
import { ApiResponseFactory } from '../../../../utils/http/api-response.util'
import { handleApiError } from '../../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../../utils/http/route-parameter.util'
import { validateDto } from '../../../../utils/validation/dto-validation.util'
import { receptionCountSchema } from '../../../../validators/reception.validator'

export default defineEventHandler(async (event) => {
    try {
        const { auth, access } = requireReceptionAccess(event)
        const occurrenceId = getPositiveIntegerParam(event, 'occurrenceId')
        const dto = validateDto(receptionCountSchema, await readBody(event))
        const scope = await resolveOccurrenceScope(auth)
        const data = await compareEnvelope(occurrenceId, dto, scope, access)
        return ApiResponseFactory.success(data, 'Conteo comparado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
