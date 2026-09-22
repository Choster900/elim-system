import Joi from 'joi'
import type { CreatePermissionDto } from '../dto/permission/create-permission.dto'
import type { UpdatePermissionDto } from '../dto/permission/update-permission.dto'

export const createPermissionSchema = Joi.object<CreatePermissionDto>({
    name: Joi.string().min(1).required(),
    code: Joi.string().min(1).required(),
    module: Joi.string().trim().max(100).required(),
    resource: Joi.string().min(1).required(),
    action: Joi.string().min(1).required(),
    description: Joi.string().allow('').optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
})

export const updatePermissionSchema = Joi.object<UpdatePermissionDto>({
    name: Joi.string().min(1).optional(),
    code: Joi.string().min(1).optional(),
    module: Joi.string().trim().max(100).optional(),
    resource: Joi.string().min(1).optional(),
    action: Joi.string().min(1).optional(),
    description: Joi.string().allow('').optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
}).min(1)
