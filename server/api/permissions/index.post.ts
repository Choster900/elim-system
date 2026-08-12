import { createPermission } from '../../services/permission.service'
import { createPermissionSchema } from '../../validators/permission.validator'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const dto = validateDto(createPermissionSchema, await readBody(event))
        const data = await createPermission(dto)
        return ApiResponseFactory.success(data, 'Permiso creado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
