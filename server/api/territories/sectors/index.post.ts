import { createSector } from '../../../services/territory.service'
import { requirePermission } from '../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'
import { validateDto } from '../../../utils/validation/dto-validation.util'
import { createSectorSchema } from '../../../validators/territory.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'territories.manage')
        const dto = validateDto(createSectorSchema, await readBody(event))
        const data = await createSector(dto)
        return ApiResponseFactory.success(data, 'Sector creado correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
