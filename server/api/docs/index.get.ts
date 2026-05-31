import { createScalarHtml } from '../../utils/swagger.util'

export default defineEventHandler(() => {
    return new Response(createScalarHtml(), {
        headers: {
            'content-type': 'text/html; charset=utf-8',
        },
    })
})
