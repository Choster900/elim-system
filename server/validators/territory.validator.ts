import Joi from 'joi'
import type {
    CreateDistrictDto,
    CreateSectorDto,
    CreateZoneDto,
    UpdateDistrictDto,
    UpdateSectorDto,
    UpdateZoneDto,
} from '../dto/territory/territory.dto'

const pointSchema = Joi.array()
    .ordered(Joi.number().min(-90).max(90).required(), Joi.number().min(-180).max(180).required())
    .length(2)

const polygonSchema = Joi.array().items(pointSchema).min(3).max(500)

const baseFields = {
    name: Joi.string().trim().min(2).max(100),
    code: Joi.string().trim().uppercase().min(1).max(100),
    leaderName: Joi.string().trim().max(100).allow('', null),
    description: Joi.string().trim().max(300).allow('', null),
    color: Joi.string()
        .trim()
        .pattern(/^#[0-9a-f]{6}$/i),
    polygon: polygonSchema,
    isActive: Joi.boolean(),
}

const requiredBaseFields = {
    name: baseFields.name.required(),
    code: baseFields.code.required(),
    leaderName: baseFields.leaderName.default(null),
    description: baseFields.description.default(null),
    color: baseFields.color.required(),
    polygon: baseFields.polygon.required(),
    isActive: baseFields.isActive.default(true),
}

export const createDistrictSchema = Joi.object<CreateDistrictDto>(requiredBaseFields)

export const updateDistrictSchema = Joi.object<UpdateDistrictDto>(baseFields).min(1)

export const createZoneSchema = Joi.object<CreateZoneDto>({
    ...requiredBaseFields,
    districtId: Joi.number().integer().positive().required(),
})

export const updateZoneSchema = Joi.object<UpdateZoneDto>({
    ...baseFields,
    districtId: Joi.number().integer().positive(),
}).min(1)

export const createSectorSchema = Joi.object<CreateSectorDto>({
    name: requiredBaseFields.name,
    description: requiredBaseFields.description,
    color: requiredBaseFields.color,
    polygon: requiredBaseFields.polygon,
    isActive: requiredBaseFields.isActive,
    zoneId: Joi.number().integer().positive().required(),
    supervisorId: Joi.number().integer().positive().required(),
})

export const updateSectorSchema = Joi.object<UpdateSectorDto>({
    name: baseFields.name,
    description: baseFields.description,
    color: baseFields.color,
    polygon: baseFields.polygon,
    isActive: baseFields.isActive,
    zoneId: Joi.number().integer().positive(),
    supervisorId: Joi.number().integer().positive(),
}).min(1)
