import { updateZone } from '../../../services/territory.service'
import { requirePermission } from '../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../utils/http/route-parameter.util'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { updateZoneSchema } from '../../../validators/territory.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'territories.manage')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(updateZoneSchema, await readBody(event))
        const data = await updateZone(id, dto)
        return ApiResponseFactory.success(data, 'Zona actualizada correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
