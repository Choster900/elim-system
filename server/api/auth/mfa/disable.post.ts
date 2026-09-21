import { clearAuthCookies } from '../../../utils/auth/auth-cookie.util'
import { requireAuth } from '../../../utils/auth/require-auth.util'
import { disableMfa } from '../../../services/mfa.service'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { mfaDisableSchema } from '../../../validators/mfa.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requireAuth(event)
        const dto = validateDto(mfaDisableSchema, await readBody(event))
        await disableMfa(auth.userId, dto)
        clearAuthCookies(event)
        return ApiResponseFactory.success(null, 'Segundo factor desactivado')
    } catch (error) {
        return handleApiError(event, error)
    }
})
