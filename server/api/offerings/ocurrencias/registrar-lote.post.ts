import { resolveOccurrenceScope } from '../../../services/access-scope.service'
import { recordOccurrencesBulk } from '../../../services/meeting-occurrence.service'
import { requirePermission } from '../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { bulkRecordOccurrencesSchema } from '../../../validators/offering.validator'

// Captura masiva desde la matriz. Enviar solo algunas de las fechas pendientes es
// el caso normal: nadie recuerda las cuatro con la misma certeza.
export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.record')
        const dto = validateDto(bulkRecordOccurrencesSchema, await readBody(event))
        const scope = await resolveOccurrenceScope(auth)
        const data = await recordOccurrencesBulk(dto, scope, auth.userId)
        return ApiResponseFactory.success(data, 'Fechas registradas correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
