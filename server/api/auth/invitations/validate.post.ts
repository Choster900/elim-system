import { validateInvitationSchema } from '../../../validators/auth.validator'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { validateInvitation } from '../../../services/user.service'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const dto = validateDto(validateInvitationSchema, await readBody(event))
        const invitation = await validateInvitation(dto.invitationToken)
        return ApiResponseFactory.success(invitation, 'Invitación válida')
    } catch (error) {
        return handleApiError(event, error)
    }
})
