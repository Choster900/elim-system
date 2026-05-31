import { createOpenApiSpec } from '../../utils/swagger.util'
import { getRequestURL } from 'h3'

export default defineEventHandler((event) => {
    const config = useRuntimeConfig()
    const url = getRequestURL(event)
    const baseUrl = `${url.protocol}//${url.host}`

    return createOpenApiSpec({
        appName: config.public.appName,
        appUrl: baseUrl,
    })
})
