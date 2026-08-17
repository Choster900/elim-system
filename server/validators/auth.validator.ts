import Joi from 'joi'
import type { LoginRequestDto } from '../dto/auth/login-request.dto'
import type { RefreshRequestDto } from '../dto/auth/refresh-request.dto'
import type { ChangePasswordRequestDto } from '../dto/auth/change-password-request.dto'
import type { ValidateInvitationRequestDto } from '../dto/auth/invitation-request.dto'

export const loginSchema = Joi.object<LoginRequestDto>({
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .trim()
        .lowercase()
        .required(),
    password: Joi.string().min(8).max(128).required(),
    invitationToken: Joi.string().trim().min(32).max(200).optional(),
})

export const refreshSchema = Joi.object<RefreshRequestDto>({
    refreshToken: Joi.string().trim().min(32).optional(),
})

const strongPassword = Joi.string()
    .min(10)
    .max(128)
    .pattern(/[a-z]/, 'minúscula')
    .pattern(/[A-Z]/, 'mayúscula')
    .pattern(/[0-9]/, 'número')
    .pattern(/[^a-zA-Z0-9]/, 'símbolo')

export const changePasswordSchema = Joi.object<ChangePasswordRequestDto>({
    currentPassword: Joi.string().min(8).max(128).required(),
    newPassword: strongPassword.invalid(Joi.ref('currentPassword')).required(),
})

export const validateInvitationSchema = Joi.object<ValidateInvitationRequestDto>({
    invitationToken: Joi.string().trim().min(32).max(200).required(),
})
