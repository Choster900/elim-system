import { requireAuth } from '../../../../utils/auth/require-auth.util'
import { startEmailDisable } from '../../../../services/mfa.service'
import { ApiResponseFactory } from '../../../../utils/http/api-response.util'
import { handleApiError } from '../../../../utils/http/error-handler.util'
import { validateDto } from '../../../../utils/validation/dto-validation.util'
import { mfaPasswordSchema } from '../../../../validators/mfa.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requireAuth(event)
        const dto = validateDto(mfaPasswordSchema, await readBody(event))
        return ApiResponseFactory.success(await startEmailDisable(auth.userId, dto.password))
    } catch (error) {
        return handleApiError(event, error)
    }
})
