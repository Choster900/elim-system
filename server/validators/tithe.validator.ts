import Joi from 'joi'
import type { SaveTitheDto, TitheFiltersDto } from '../dto/tithe/tithe.dto'

export const titheFiltersSchema = Joi.object<TitheFiltersDto>({
    from: Joi.string().isoDate(),
    to: Joi.string().isoDate(),
})

export const saveTitheSchema = Joi.object<SaveTitheDto>({
    memberId: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().max(10000000).precision(2).required(),
    date: Joi.string().isoDate().required(),
    notes: Joi.string().trim().max(300).allow('', null).default(null),
})
