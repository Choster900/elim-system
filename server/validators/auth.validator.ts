import Joi from 'joi'
import type { LoginRequestDto } from '../dto/auth/login-request.dto'
import type { RefreshRequestDto } from '../dto/auth/refresh-request.dto'

export const loginSchema = Joi.object<LoginRequestDto>({
    email: Joi.string().email({ tlds: { allow: false } }).trim().lowercase().required(),
    password: Joi.string().min(8).max(128).required(),
})

export const refreshSchema = Joi.object<RefreshRequestDto>({
    refreshToken: Joi.string().trim().min(32).optional(),
})
