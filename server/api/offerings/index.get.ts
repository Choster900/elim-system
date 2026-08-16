import { getQuery } from 'h3'
import { resolveOfferingScope } from '../../services/access-scope.service'
import { getOfferings } from '../../services/offering.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.view')
        const query = getQuery(event)
        const meetingIdRaw = query.meetingId
        const meetingId = meetingIdRaw ? Number(meetingIdRaw) : undefined
        const filters: { meetingId?: number; sectorIds?: number[] } =
            meetingId && Number.isSafeInteger(meetingId) && meetingId > 0 ? { meetingId } : {}

        const scope = await resolveOfferingScope(auth)
        if (!scope.seesAll) filters.sectorIds = scope.sectorIds

        const data = await getOfferings(filters)
        return ApiResponseFactory.success(data, 'Ofrendas obtenidas correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
