import { updateMeetingType } from '../../services/meeting.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { updateMeetingTypeSchema } from '../../validators/meeting.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'meeting-types.manage')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(updateMeetingTypeSchema, await readBody(event))
        const data = await updateMeetingType(id, dto)
        return ApiResponseFactory.success(data, 'Tipo de reunión actualizado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
