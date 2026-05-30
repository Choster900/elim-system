import { createHealthResponse } from '../../services/health.service'

export default defineEventHandler(() => {
    const config = useRuntimeConfig()
    return createHealthResponse(config.public.appName)
})
