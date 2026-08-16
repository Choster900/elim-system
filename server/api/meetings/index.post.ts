import { createMeeting } from '../../services/meeting.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { createMeetingSchema } from '../../validators/meeting.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'meetings.manage')
        const dto = validateDto(createMeetingSchema, await readBody(event))
        const data = await createMeeting(dto)
        return ApiResponseFactory.success(data, 'Reunión creada correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
