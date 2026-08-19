import { createAttendanceType } from '../../services/attendance.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { createAttendanceTypeSchema } from '../../validators/attendance.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'finance.manage')
        const dto = validateDto(createAttendanceTypeSchema, await readBody(event))
        const data = await createAttendanceType(dto)
        return ApiResponseFactory.success(data, 'Tipo de asistencia creado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
