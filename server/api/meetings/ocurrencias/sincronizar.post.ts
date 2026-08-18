import { syncOccurrences } from '../../../services/meeting-occurrence.service'
import { requirePermission } from '../../../utils/auth/require-permission.util'
import { ApiResponseFactory } from '../../../utils/http/api-response.util'
import { handleApiError } from '../../../utils/http/error-handler.util'

// Sincronización manual. El flujo normal la dispara solo al consultar pendientes;
// esto existe para forzarla tras cambiar reglas de recurrencia en bloque.
export default defineEventHandler(async (event) => {
    try {
        requirePermission(event, 'finance.manage')
        const data = await syncOccurrences()
        return ApiResponseFactory.success(data, 'Ocurrencias sincronizadas correctamente')
    } catch (error) {
        return handleApiError(event, error)
    }
})
