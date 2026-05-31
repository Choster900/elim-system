import { ApiResponseFactory } from '../../utils/response.util'
import { handleApiError } from '../../utils/error-handler.util'
import { validateDto } from '../../utils/validate-dto.util'
import { refreshSchema } from '../../validators/auth.validator'
import { extractRefreshToken } from '../../utils/auth/token-extractor.util'
import { setAccessTokenCookie, setRefreshTokenCookie } from '../../utils/auth/auth-cookie.util'
import { refreshAuth } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
    try {
        const body = (await readBody(event).catch(() => ({}))) ?? {}
        const dto = validateDto(refreshSchema, body)
        const refreshToken = extractRefreshToken(event, dto.refreshToken)
        const authResult = await refreshAuth(refreshToken)

        setAccessTokenCookie(event, authResult.tokens.accessToken)
        setRefreshTokenCookie(event, authResult.refreshToken)

        return ApiResponseFactory.success(
            {
                user: authResult.user,
                tokens: authResult.tokens,
            },
            'Token refrescado correctamente',
        )
    } catch (error) {
        return handleApiError(event, error)
    }
})
