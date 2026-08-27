import { createHealthResponse } from '../../services/health.service'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'

export default defineEventHandler(async (event) => {
    try {
        const config = useRuntimeConfig()
        const data = await createHealthResponse(config.public.appName)
        return ApiResponseFactory.success(data, 'Servicio en funcionamiento')
    } catch (error) {
        return handleApiError(event, error)
    }
})
