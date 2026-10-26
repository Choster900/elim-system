import { updateTithe } from '../../services/tithe.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { saveTitheSchema } from '../../validators/tithe.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.receive')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(saveTitheSchema, await readBody(event))
        const data = await updateTithe(id, dto, auth.userId)
        return ApiResponseFactory.success(data, 'Diezmo actualizado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
