import { getAllPermissions } from '../../services/permission.service'
import { ApiResponseFactory } from '../../utils/http/api-response.util'
import { handleApiError } from '../../utils/http/error-handler.util'
import { parsePaginationParams, buildPaginationMeta } from '../../utils/http/pagination.util'

export default defineEventHandler(async (event) => {
    try {
        const { page, limit, skip } = parsePaginationParams(event)
        const { items, totalItems } = await getAllPermissions(skip, limit)
        const pagination = buildPaginationMeta(page, limit, totalItems)
        return ApiResponseFactory.success(items, 'Permisos obtenidos correctamente', { pagination })
    } catch (error) {
        return handleApiError(event, error)
    }
})
