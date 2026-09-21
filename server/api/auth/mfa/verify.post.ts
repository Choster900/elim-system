import { completeMfaLogin } from '../../../services/auth.service'
import { setAccessTokenCookie, setRefreshTokenCookie } from '../../../utils/auth/auth-cookie.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { mfaChallengeSchema } from '../../../validators/mfa.validator'

export default defineEventHandler(async (event) => {
    try {
        const dto = validateDto(mfaChallengeSchema, await readBody(event))
        const result = await completeMfaLogin(dto.challengeToken, dto.code)
        setAccessTokenCookie(event, result.tokens.accessToken)
        setRefreshTokenCookie(event, result.refreshToken)
        return ApiResponseFactory.success(
            { user: result.user, tokens: result.tokens },
            'Inicio de sesión verificado',
        )
    } catch (error) {
        return handleApiError(event, error)
    }
})
