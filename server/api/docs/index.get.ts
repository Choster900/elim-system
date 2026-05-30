import { createSwaggerHtml } from '../../utils/swagger.util'

export default defineEventHandler(() => {
    return new Response(createSwaggerHtml(), {
        headers: {
            'content-type': 'text/html; charset=utf-8',
        },
    })
})
