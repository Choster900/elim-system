import { getAttendanceTypes } from '../../services/attendance.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'finance.view')
        const data = await getAttendanceTypes()
        return ApiResponseFactory.success(data, 'Tipos de asistencia obtenidos correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
