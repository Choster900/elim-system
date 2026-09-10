import { requestPasswordResetSchema } from '../../../validators/auth.validator'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { requestPasswordReset } from '../../../services/auth.service'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const dto = validateDto(requestPasswordResetSchema, await readBody(event))
        await requestPasswordReset(dto)

        return ApiResponseFactory.success(
            null,
            'Si el correo existe, enviaremos un enlace para reiniciar la contraseña',
        )
    } catch (error) {
        return handleApiError(event, error)
    }
})
