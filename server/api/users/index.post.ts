import { createUser } from '../../services/user.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { createUserSchema } from '../../validators/user.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'users.create')
        const dto = validateDto(createUserSchema, await readBody(event))
        const user = await createUser(dto, auth.userId)
        return ApiResponseFactory.success(user, 'Usuario creado e invitación enviada correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
