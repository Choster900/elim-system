import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { loginSchema } from '../../validators/auth.validator'
import { setAccessTokenCookie, setRefreshTokenCookie } from '../../utils/auth/auth-cookie.util'
import { login } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
    try {
        const dto = validateDto(loginSchema, await readBody(event))
        const authResult = await login(dto)

        setAccessTokenCookie(event, authResult.tokens.accessToken)
        setRefreshTokenCookie(event, authResult.refreshToken)

        return ApiResponseFactory.success(
            {
                user: authResult.user,
                tokens: authResult.tokens,
            },
            'Login exitoso',
        )
    } catch (error) {
        return handleApiError(event, error)
    }
})
