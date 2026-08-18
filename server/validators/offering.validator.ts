import Joi from 'joi'
import type {
    CreateOfferingCategoryDto,
    UpdateOfferingCategoryDto,
} from '../dto/offering/offering.dto'
import type {
    BulkRecordOccurrencesDto,
    OccurrenceFiltersDto,
    RecordOccurrenceDto,
    UpdateOccurrenceDto,
} from '../dto/offering/occurrence.dto'

const detailSchema = Joi.object({
    categoryId: Joi.number().integer().positive().required(),
    amount: Joi.number().min(0).precision(2).required(),
    notes: Joi.string().trim().max(300).allow('', null).default(null),
})

const captureFields = {
    attendance: Joi.number().integer().min(0).max(1000000),
    // Solo se usa cuando no hay desglose por categoría.
    totalAmount: Joi.number().min(0).precision(2).allow(null),
    currency: Joi.string().trim().uppercase().min(3).max(10),
    notes: Joi.string().trim().max(600).allow('', null),
    details: Joi.array().items(detailSchema),
}

export const recordOccurrenceSchema = Joi.object<RecordOccurrenceDto>({
    attendance: captureFields.attendance.required(),
    totalAmount: captureFields.totalAmount.default(null),
    currency: captureFields.currency.default('USD'),
    notes: captureFields.notes.default(null),
    details: captureFields.details.default([]),
})
    // Sin desglose hay que dar el total global; con desglose, el total se calcula.
    .custom((value: RecordOccurrenceDto, helpers) => {
        if (value.details.length === 0 && value.totalAmount === null) {
            return helpers.error('any.custom')
        }
        return value
    })
    .messages({
        'any.custom': 'Indica el monto total o al menos una categoría de ofrenda',
    })

export const bulkRecordOccurrencesSchema = Joi.object<BulkRecordOccurrencesDto>({
    entries: Joi.array()
        .items(
            recordOccurrenceSchema.append({
                occurrenceId: Joi.number().integer().positive().required(),
            }),
        )
        .min(1)
        .max(200)
        .required(),
})

export const updateOccurrenceSchema = Joi.object<UpdateOccurrenceDto>(captureFields).min(1)

export const occurrenceFiltersSchema = Joi.object<OccurrenceFiltersDto>({
    meetingId: Joi.number().integer().positive(),
    status: Joi.string().valid('pendiente', 'registrada'),
    from: Joi.string().isoDate(),
    to: Joi.string().isoDate(),
})

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
