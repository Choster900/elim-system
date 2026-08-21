import { createMember } from '../../services/member.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { createMemberSchema } from '../../validators/member.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'members.create')
        const dto = validateDto(createMemberSchema, await readBody(event))
        const data = await createMember(dto)
        return ApiResponseFactory.success(data, 'Miembro creado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
