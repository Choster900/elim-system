import { createHealthResponse } from '../../services/health.service'
import { ApiResponseFactory } from '../../utils/response.util'

export default defineEventHandler(() => {
    const config = useRuntimeConfig()
    const data = createHealthResponse(config.public.appName)
    return ApiResponseFactory.success(data, 'Servicio en funcionamiento')
})
