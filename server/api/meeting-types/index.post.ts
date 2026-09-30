import { createMeetingType } from '../../services/meeting.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { createMeetingTypeSchema } from '../../validators/meeting.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'meeting-types.manage')
        const dto = validateDto(createMeetingTypeSchema, await readBody(event))
        const data = await createMeetingType(dto)
        return ApiResponseFactory.success(data, 'Tipo de reunión creado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
