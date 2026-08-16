import { resolveOfferingScope } from '../../services/access-scope.service'
import { updateOffering } from '../../services/offering.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { updateOfferingSchema } from '../../validators/offering.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.manage')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(updateOfferingSchema, await readBody(event))
        const scope = await resolveOfferingScope(auth)
        const data = await updateOffering(id, dto, scope.seesAll ? undefined : scope.sectorIds)
        return ApiResponseFactory.success(data, 'Ofrenda actualizada correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
