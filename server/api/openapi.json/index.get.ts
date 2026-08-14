import { createOpenApiSpec } from '../../utils/openapi/api-docs.util'
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
