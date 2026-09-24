import { createError } from 'h3'
import { resolveOccurrenceScope } from '../../../services/access-scope.service'
import { getMeetingById } from '../../../services/meeting.service'
import { getPendingOccurrences } from '../../../services/meeting-occurrence.service'
import { requirePermission } from '../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../../utils/http/route-parameter.util'

export default defineEventHandler(async (event) => {
    try {
        const auth = requirePermission(event, 'finance.record')
        const id = getPositiveIntegerParam(event, 'id')
        const scope = await resolveOccurrenceScope(auth)
        const pending = await getPendingOccurrences(scope)

        if (!pending.some((occurrence) => occurrence.meetingId === id)) {
            throw createError({ statusCode: 404, message: 'La reunión solicitada no existe' })
        }

        const data = await getMeetingById(id)
        return ApiResponseFactory.success(data, 'Detalle de reunión obtenido correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
