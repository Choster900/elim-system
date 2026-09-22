import Joi from 'joi'
import type { CreateRoleDto, UpdateRoleDto } from '../dto/role/role.dto'

const roleFields = {
    name: Joi.string().trim().min(1).max(100),
    code: Joi.string()
        .trim()
        .uppercase()
        .pattern(/^[A-Z][A-Z0-9_]{2,99}$/),
    description: Joi.string().trim().max(300).allow(''),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
    permissionIds: Joi.array().items(Joi.number().integer().positive()).unique().min(1),
}

export const createRoleSchema = Joi.object<CreateRoleDto>({
    name: roleFields.name.required(),
    code: roleFields.code.required(),
    description: roleFields.description.default(''),
    status: roleFields.status.default('ACTIVE'),
    permissionIds: roleFields.permissionIds.required(),
})

export const updateRoleSchema = Joi.object<UpdateRoleDto>({
    name: roleFields.name.required(),
    code: roleFields.code.required(),
    description: roleFields.description.default(''),
    status: roleFields.status.required(),
    permissionIds: roleFields.permissionIds.required(),
})
