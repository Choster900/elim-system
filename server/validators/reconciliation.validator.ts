import Joi from 'joi'
import type {
    CloseDiscrepancyDto,
    ReconciliationFiltersDto,
} from '../dto/offering/reconciliation.dto'

export const reconciliationFiltersSchema = Joi.object<ReconciliationFiltersDto>({
    from: Joi.string().isoDate(),
    to: Joi.string().isoDate(),
    zoneId: Joi.number().integer().positive(),
    sectorId: Joi.number().integer().positive(),
})

export const closeDiscrepancySchema = Joi.object<CloseDiscrepancyDto>({
    notes: Joi.string().trim().min(5).max(600).required().messages({
        'string.empty': 'Escribe qué se resolvió con esta diferencia',
        'string.min': 'Explica con un poco más de detalle qué se resolvió',
        'any.required': 'Escribe qué se resolvió con esta diferencia',
    }),
})
