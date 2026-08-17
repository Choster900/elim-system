import { updateUser } from '../../services/user.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { updateUserSchema } from '../../validators/user.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'users.update')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(updateUserSchema, await readBody(event))
        const user = await updateUser(id, dto, auth.userId)
        return ApiResponseFactory.success(user, 'Usuario actualizado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
