import { importMembers } from '../../services/member.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { importMembersSchema } from '../../validators/member.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'members.import_export')
        const dto = validateDto(importMembersSchema, await readBody(event))
        const data = await importMembers(dto)
        const message = data.rejected
            ? 'Importación completada con registros pendientes'
            : 'Miembros importados correctamente'
        return ApiResponseFactory.success(data, message)
    } catch (error) {
        return handleApiError(event, error)
    }
})
