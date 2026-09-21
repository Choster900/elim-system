import { clearAuthCookies } from '../../../../utils/auth/auth-cookie.util'
import { requireAuth } from '../../../../utils/auth/require-auth.util'
import { confirmTotpSetup } from '../../../../services/mfa.service'
import { ApiResponseFactory } from '../../../../utils/http/api-response.util'
import { handleApiError } from '../../../../utils/http/error-handler.util'
import { validateDto } from '../../../../utils/validation/dto-validation.util'
import { mfaCodeSchema } from '../../../../validators/mfa.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requireAuth(event)
        const dto = validateDto(mfaCodeSchema, await readBody(event))
        const result = await confirmTotpSetup(auth.userId, dto.code)
        clearAuthCookies(event)
        return ApiResponseFactory.success(
            result,
            'TOTP activado. Guarda los códigos de recuperación.',
        )
    } catch (error) {
        return handleApiError(event, error)
    }
})
