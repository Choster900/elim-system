import { updateDistrict } from '../../../services/territory.service'
import { requirePermission } from '../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../utils/http/route-parameter.util'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { updateDistrictSchema } from '../../../validators/territory.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'territories.manage')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(updateDistrictSchema, await readBody(event))
        const data = await updateDistrict(id, dto)
        return ApiResponseFactory.success(data, 'Distrito actualizado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
