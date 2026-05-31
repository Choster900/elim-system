import { updatePermission } from '../../services/permission.service'
import { updatePermissionSchema } from '../../validators/permission.validator'
import { validateDto } from '../../utils/validate-dto.util'
import { ApiResponseFactory } from '../../utils/response.util'
import { handleApiError } from '../../utils/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')!
        const dto = validateDto(updatePermissionSchema, await readBody(event))
        const data = await updatePermission(id, dto)
        return ApiResponseFactory.success(data, 'Permiso actualizado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
