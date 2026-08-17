import { resetUserPassword } from '../../../services/user.service'
import { requirePermission } from '../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../utils/http/route-parameter.util'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { resetUserPasswordSchema } from '../../../validators/user.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'users.update')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(resetUserPasswordSchema, await readBody(event))
        const user = await resetUserPassword(id, dto, auth.userId)
        return ApiResponseFactory.success(
            user,
            'Contraseña temporal e invitación reenviadas correctamente',
        )
    } catch (error) {
        return handleApiError(event, error)
    }
})
