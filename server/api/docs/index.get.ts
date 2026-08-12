import { createScalarHtml } from '../../utils/openapi/api-docs.util'

export default defineEventHandler(() => {
    return new Response(createScalarHtml(), {
        headers: {
            'content-type': 'text/html; charset=utf-8',
        },
    })
})
