import Joi from 'joi'
import type {
    CreateOfferingCategoryDto,
    CreateOfferingDto,
    UpdateOfferingCategoryDto,
    UpdateOfferingDto,
} from '../dto/offering/offering.dto'

const detailSchema = Joi.object({
    categoryId: Joi.number().integer().positive().required(),
    amount: Joi.number().min(0).precision(2).required(),
    notes: Joi.string().trim().max(300).allow('', null).default(null),
})

const baseFields = {
    meetingId: Joi.number().integer().positive(),
    date: Joi.string().isoDate(),
    attendance: Joi.number().integer().min(0).max(1000000),
    currency: Joi.string().trim().uppercase().min(3).max(10),
    notes: Joi.string().trim().max(600).allow('', null),
    details: Joi.array().items(detailSchema).min(1),
}

export const createOfferingSchema = Joi.object<CreateOfferingDto>({
    meetingId: baseFields.meetingId.required(),
    date: baseFields.date.required(),
    attendance: baseFields.attendance.default(0),
    currency: baseFields.currency.default('USD'),
    notes: baseFields.notes.default(null),
    details: baseFields.details.required(),
})

export const updateOfferingSchema = Joi.object<UpdateOfferingDto>(baseFields).min(1)

const categoryBaseFields = {
    code: Joi.string().trim().uppercase().min(1).max(100),
    name: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(300).allow('', null),
    sortOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
}

export const createOfferingCategorySchema = Joi.object<CreateOfferingCategoryDto>({
    code: categoryBaseFields.code.required(),
    name: categoryBaseFields.name.required(),
    description: categoryBaseFields.description.default(null),
    sortOrder: categoryBaseFields.sortOrder.default(0),
    isActive: categoryBaseFields.isActive.default(true),
})

export const updateOfferingCategorySchema =
    Joi.object<UpdateOfferingCategoryDto>(categoryBaseFields).min(1)
