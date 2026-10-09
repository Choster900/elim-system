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
    search: Joi.string().trim().max(100).allow(''),
    zoneId: Joi.number().integer().positive(),
}).unknown(true)

export const receptionFiltersSchema = Joi.object<ReceptionFiltersDto>({
    status: Joi.string().valid('cuadra', 'con_diferencia'),
    from: Joi.string().isoDate(),
    to: Joi.string().isoDate(),
})
