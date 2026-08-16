import { resolveOfferingScope } from '../../services/access-scope.service'
import { getMeetings } from '../../services/meeting.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

// Sector-scoped meeting options for the offering form. Uses finance.view so
// supervisors (who lack meetings.view) can still populate the meeting selector.
export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.view')
        const scope = await resolveOfferingScope(auth)
        const data = scope.seesAll
            ? await getMeetings()
            : await getMeetings({ sectorIds: scope.sectorIds })
        return ApiResponseFactory.success(data, 'Reuniones obtenidas correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
