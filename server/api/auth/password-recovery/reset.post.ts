import { resetPasswordSchema } from '../../../validators/auth.validator'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { resetPasswordWithToken } from '../../../services/auth.service'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const dto = validateDto(resetPasswordSchema, await readBody(event))
        await resetPasswordWithToken(dto)
        return ApiResponseFactory.success(null, 'Contraseña reiniciada correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
