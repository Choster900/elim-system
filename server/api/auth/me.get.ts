import { getCurrentUser } from '../../services/auth.service'
import { requireAuth } from '../../utils/auth/require-auth.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const auth = requireAuth(event)
        const user = await getCurrentUser(auth.userId)

        return ApiResponseFactory.success(
            {
                ...user,
                tokenExpiresAt: auth.tokenExpiresAt,
            },
            'Sesión obtenida correctamente',
        )
    } catch (error) {
        return handleApiError(event, error)
    }
})
