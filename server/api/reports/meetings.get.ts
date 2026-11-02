import { getQuery } from 'h3'
import { resolveOccurrenceScope } from '../../services/access-scope.service'
import { getMeetingReport } from '../../services/report.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { meetingReportQuerySchema } from '../../validators/report.validator'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'reports.view')
        const query = validateDto(meetingReportQuerySchema, getQuery(event))
        const scope = await resolveOccurrenceScope(auth)
        const data = await getMeetingReport(scope, query)

        return ApiResponseFactory.success(data, 'Reporte de reuniones generado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
