import { clearAuthCookies } from '../../../../utils/auth/auth-cookie.util'
import { requireAuth } from '../../../../utils/auth/require-auth.util'
import { confirmEmailSetup } from '../../../../services/mfa.service'
import { ApiResponseFactory } from '../../../../utils/http/api-response.util'
import { handleApiError } from '../../../../utils/http/error-handler.util'
import { validateDto } from '../../../../utils/validation/dto-validation.util'
import { mfaChallengeSchema } from '../../../../validators/mfa.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requireAuth(event)
        const dto = validateDto(mfaChallengeSchema, await readBody(event))
        await confirmEmailSetup(auth.userId, dto.challengeToken, dto.code)
        clearAuthCookies(event)
        return ApiResponseFactory.success(null, 'Verificación por correo activada')
    } catch (error) {
        return handleApiError(event, error)
    }
})
