import { resolveOfferingScope } from '../../services/access-scope.service'
import { createOfferingsBulk } from '../../services/offering.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { createOfferingsBulkSchema } from '../../validators/offering.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.manage')
        const dto = validateDto(createOfferingsBulkSchema, await readBody(event))
        const scope = await resolveOfferingScope(auth)
        const data = await createOfferingsBulk(
            dto.offerings,
            auth.userId,
            scope.seesAll ? undefined : scope.sectorIds,
        )
        return ApiResponseFactory.success(data, `${data.length} registros guardados correctamente`)
    } catch (error) {
        return handleApiError(event, error)
    }
})
