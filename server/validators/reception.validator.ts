import Joi from 'joi'
import type {
    PendingEnvelopesFiltersDto,
    ReceiveEnvelopeDto,
    ReceptionCountDto,
    ReceptionFiltersDto,
} from '../dto/offering/reception.dto'

const countSchema = Joi.object({
    denominationId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(0).max(100000).required(),
})

const categorySchema = Joi.object({
    categoryId: Joi.number().integer().positive().allow(null).required(),
    counts: Joi.array().items(countSchema).max(50).default([]),
    amount: Joi.number().min(0).max(10000000).precision(2),
})

const countFields = {
    categories: Joi.array().items(categorySchema).max(20).required(),
}

export const receptionCountSchema = Joi.object<ReceptionCountDto>(countFields)

export const receiveEnvelopeSchema = Joi.object<ReceiveEnvelopeDto>({
    ...countFields,
    notes: Joi.string().trim().max(600).allow('', null).default(null),
})

export const pendingEnvelopesFiltersSchema = Joi.object<PendingEnvelopesFiltersDto>({
    kind: Joi.string().valid('lideres', 'generales'),
    order: Joi.string().valid('asc', 'desc').default('asc'),
    search: Joi.string().trim().max(100).allow(''),
    districtId: Joi.number().integer().positive(),
    zoneId: Joi.number().integer().positive(),
    sectorId: Joi.number().integer().positive(),
    dateField: Joi.string().valid('reunion', 'registro').default('reunion'),
    from: Joi.string().isoDate(),
    to: Joi.string().isoDate(),
}).unknown(true)

export const receptionFiltersSchema = Joi.object<ReceptionFiltersDto>({
    status: Joi.string().valid('cuadra', 'con_diferencia'),
    from: Joi.string().isoDate(),
    to: Joi.string().isoDate(),
})
