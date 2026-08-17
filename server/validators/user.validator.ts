import Joi from 'joi'
import type {
    CreateUserRequestDto,
    ResetUserPasswordRequestDto,
    UpdateUserRequestDto,
    UpdateUserStatusRequestDto,
} from '../dto/users/user.dto'

const email = Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .lowercase()
    .max(100)

const username = Joi.string()
    .trim()
    .lowercase()
    .min(4)
    .max(100)
    .pattern(/^[a-z0-9._-]+$/)
const roleCodes = Joi.array().items(Joi.string().trim().uppercase().max(100)).min(1).max(8).unique()
const invitationExpiresInHours = Joi.number().integer().min(1).max(168)

export const createUserSchema = Joi.object<CreateUserRequestDto>({
    memberId: Joi.number().integer().positive().required(),
    username: username.required(),
    email: email.required(),
    roleCodes: roleCodes.required(),
    requirePasswordChange: Joi.boolean().required(),
    twoFactorEnabled: Joi.boolean().default(false),
    invitationExpiresInHours: invitationExpiresInHours.required(),
})

export const updateUserSchema = Joi.object<UpdateUserRequestDto>({
    username: username.required(),
    email: email.required(),
    roleCodes: roleCodes.required(),
    status: Joi.string().valid('ACTIVE', 'INVITED', 'BLOCKED').required(),
    requirePasswordChange: Joi.boolean().required(),
    twoFactorEnabled: Joi.boolean().required(),
})

export const updateUserStatusSchema = Joi.object<UpdateUserStatusRequestDto>({
    status: Joi.string().valid('ACTIVE', 'BLOCKED').required(),
})

export const resetUserPasswordSchema = Joi.object<ResetUserPasswordRequestDto>({
    requirePasswordChange: Joi.boolean().required(),
    invitationExpiresInHours: invitationExpiresInHours.required(),
})
