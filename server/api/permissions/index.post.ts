import { createPermission } from '../../services/permission.service'
import { createPermissionSchema } from '../../validators/permission.validator'
import { validateDto } from '../../utils/validate-dto.util'
import { ApiResponseFactory } from '../../utils/response.util'
import { handleApiError } from '../../utils/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const dto = validateDto(createPermissionSchema, await readBody(event))
        const data = await createPermission(dto)
        return ApiResponseFactory.success(data, 'Permiso creado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
