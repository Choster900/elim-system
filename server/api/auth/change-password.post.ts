import { changePasswordSchema } from '../../validators/auth.validator'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { requireAuth } from '../../utils/auth/require-auth.util'
import { changePassword } from '../../services/auth.service'
import { setAccessTokenCookie, setRefreshTokenCookie } from '../../utils/auth/auth-cookie.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const auth = requireAuth(event)
        const dto = validateDto(changePasswordSchema, await readBody(event))
        const authResult = await changePassword(auth.userId, dto)

        setAccessTokenCookie(event, authResult.tokens.accessToken)
        setRefreshTokenCookie(event, authResult.refreshToken)

        return ApiResponseFactory.success(
            { user: authResult.user, tokens: authResult.tokens },
            'Contraseña actualizada correctamente',
        )
    } catch (error) {
        return handleApiError(event, error)
    }
})
