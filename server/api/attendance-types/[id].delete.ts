import { deleteAttendanceType } from '../../services/attendance.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'

// Un tipo con fechas ya registradas no se borra; el servicio responde 409.
export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'finance.manage')
        const id = getPositiveIntegerParam(event, 'id')
        await deleteAttendanceType(id)
        return ApiResponseFactory.success(null, 'Tipo de asistencia eliminado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
