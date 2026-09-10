import { validatePasswordResetSchema } from '../../../validators/auth.validator'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { validatePasswordResetToken } from '../../../services/auth.service'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const dto = validateDto(validatePasswordResetSchema, await readBody(event))
        const passwordReset = await validatePasswordResetToken(dto.resetToken)
        return ApiResponseFactory.success(passwordReset, 'Enlace de recuperación válido')
    } catch (error) {
        return handleApiError(event, error)
    }
})
