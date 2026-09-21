import { requireAuth } from '../../../utils/auth/require-auth.util'
import { mfaSettings } from '../../../services/mfa.service'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const auth = requireAuth(event)
        return ApiResponseFactory.success(await mfaSettings(auth.userId))
    } catch (error) {
        return handleApiError(event, error)
    }
})
