import Joi from 'joi'

const code = Joi.string().trim().min(6).max(24).required()
const challengeToken = Joi.string().trim().min(32).max(100).required()

export const mfaPasswordSchema = Joi.object<{ password: string }>({
    password: Joi.string().min(8).max(128).required(),
})

export const mfaCodeSchema = Joi.object<{ code: string }>({ code })

export const mfaChallengeSchema = Joi.object<{ challengeToken: string; code: string }>({
    challengeToken,
    code,
})

export const mfaDisableSchema = Joi.object<{
    password?: string
    challengeToken?: string
    code: string
}>({
    password: Joi.string().min(8).max(128).optional(),
    challengeToken: Joi.string().trim().min(32).max(100).optional(),
    code,
})
