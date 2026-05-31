import { ApiResponseFactory } from '../../utils/response.util'
import { handleApiError } from '../../utils/error-handler.util'
import { validateDto } from '../../utils/validate-dto.util'
import { refreshSchema } from '../../validators/auth.validator'
import { extractRefreshToken } from '../../utils/auth/token-extractor.util'
import { clearAuthCookies } from '../../utils/auth/auth-cookie.util'
import { logout } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
    try {
        const body = (await readBody(event).catch(() => ({}))) ?? {}
        const dto = validateDto(refreshSchema, body)
        const refreshToken = extractRefreshToken(event, dto.refreshToken)
        await logout(refreshToken)

        clearAuthCookies(event)

        return ApiResponseFactory.success(null, 'Sesión cerrada correctamente')
    } catch (error) {
        clearAuthCookies(event)
        return handleApiError(event, error)
    }
})
