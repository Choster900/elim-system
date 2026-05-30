import { createOpenApiSpec } from '../../utils/swagger.util'

export default defineEventHandler(() => {
    const config = useRuntimeConfig()

    return createOpenApiSpec({
        appName: config.public.appName,
        appUrl: config.public.appUrl,
    })
})
