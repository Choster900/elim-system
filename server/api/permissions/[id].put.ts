import { updatePermission } from '../../services/permission.service'
import { updatePermissionSchema } from '../../validators/permission.validator'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'

export default defineEventHandler(async (event) => {
    try {
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(updatePermissionSchema, await readBody(event))
        const data = await updatePermission(id, dto)
        return ApiResponseFactory.success(data, 'Permiso actualizado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
