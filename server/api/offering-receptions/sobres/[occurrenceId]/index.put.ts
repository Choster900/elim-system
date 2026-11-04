import { resolveOccurrenceScope } from '../../../../services/access-scope.service'
import { correctReception } from '../../../../services/offering-reception.service'
import { requireReceptionAccess } from '../../../../utils/auth/reception-access.util'
import { ApiResponseFactory } from '../../../../utils/http/api-response.util'
import { handleApiError } from '../../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../../utils/http/route-parameter.util'
import { validateDto } from '../../../../utils/validation/dto-validation.util'
import { receiveEnvelopeSchema } from '../../../../validators/reception.validator'

export default defineEventHandler(async (event) => {
    try {
        const { auth, access } = requireReceptionAccess(event)
        const occurrenceId = getPositiveIntegerParam(event, 'occurrenceId')
        const dto = validateDto(receiveEnvelopeSchema, await readBody(event))
        const scope = await resolveOccurrenceScope(auth)
        const data = await correctReception(occurrenceId, dto, scope, access, auth.userId)
        return ApiResponseFactory.success(data, 'Conteo corregido correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
