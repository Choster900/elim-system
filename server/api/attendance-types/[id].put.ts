import { updateAttendanceType } from '../../services/attendance.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { updateAttendanceTypeSchema } from '../../validators/attendance.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'finance.manage')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(updateAttendanceTypeSchema, await readBody(event))
        const data = await updateAttendanceType(id, dto)
        return ApiResponseFactory.success(data, 'Tipo de asistencia actualizado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
