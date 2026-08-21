import { updateMember } from '../../services/member.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { getPositiveIntegerParam } from '../../utils/http/route-parameter.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { updateMemberSchema } from '../../validators/member.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'members.update')
        const id = getPositiveIntegerParam(event, 'id')
        const dto = validateDto(updateMemberSchema, await readBody(event))
        const data = await updateMember(id, dto)
        return ApiResponseFactory.success(data, 'Miembro actualizado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
