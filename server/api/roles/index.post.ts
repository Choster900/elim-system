import { createRole } from '../../services/role.service'
import { createRoleSchema } from '../../validators/role.validator'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'roles.manage')
        const dto = validateDto(createRoleSchema, await readBody(event))
        const data = await createRole(dto, auth.userId)
        return ApiResponseFactory.success(data, 'Rol creado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
