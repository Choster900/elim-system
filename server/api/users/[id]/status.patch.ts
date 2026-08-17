import { updateUserStatus } from '../../../services/user.service'
import { requirePermission } from '../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../utils/http/route-parameter.util'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { updateUserStatusSchema } from '../../../validators/user.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'users.block')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(updateUserStatusSchema, await readBody(event))
        const user = await updateUserStatus(id, dto.status)
        return ApiResponseFactory.success(user, 'Estado de usuario actualizado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
