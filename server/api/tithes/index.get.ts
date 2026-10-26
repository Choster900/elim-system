import { getTithes } from '../../services/tithe.service'
import { requirePermission } from '../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { validateDto } from '../../utils/validation/dto-validation.util'
import { titheFiltersSchema } from '../../validators/tithe.validator'

export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'finance.receive')
        const filters = validateDto(titheFiltersSchema, getQuery(event))
        const data = await getTithes(filters)
        return ApiResponseFactory.success(data, 'Diezmos obtenidos correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
