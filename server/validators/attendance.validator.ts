import Joi from 'joi'
import type {
    CreateAttendanceTypeDto,
    UpdateAttendanceTypeDto,
} from '../dto/attendance/attendance.dto'

const baseFields = {
    code: Joi.string().trim().uppercase().min(1).max(100),
    name: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(300).allow('', null),
    sortOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
}

export const createAttendanceTypeSchema = Joi.object<CreateAttendanceTypeDto>({
    code: baseFields.code.required(),
    name: baseFields.name.required(),
    description: baseFields.description.default(null),
    sortOrder: baseFields.sortOrder.default(0),
    isActive: baseFields.isActive.default(true),
})

export const updateAttendanceTypeSchema = Joi.object<UpdateAttendanceTypeDto>(baseFields).min(1)
