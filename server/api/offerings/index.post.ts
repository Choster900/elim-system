import { resolveOfferingScope } from '../../services/access-scope.service'
import { createOffering } from '../../services/offering.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { createOfferingSchema } from '../../validators/offering.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.manage')
        const dto = validateDto(createOfferingSchema, await readBody(event))
        const scope = await resolveOfferingScope(auth)
        const data = await createOffering(
            dto,
            auth.userId,
            scope.seesAll ? undefined : scope.sectorIds,
        )
        return ApiResponseFactory.success(data, 'Ofrenda registrada correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
