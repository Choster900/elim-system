import { updateRole } from '../../services/role.service'
import { updateRoleSchema } from '../../validators/role.validator'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'roles.manage')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(updateRoleSchema, await readBody(event))
        const data = await updateRole(id, dto, auth.userId)
        return ApiResponseFactory.success(data, 'Rol actualizado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
