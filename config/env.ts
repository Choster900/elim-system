/// <reference types="node" />
import process from 'node:process'
import Joi from 'joi'

export interface AppEnv {
    DATABASE_URL: string
    DIRECT_DATABASE_URL?: string
    JWT_SECRET: string
    PORT: number
    NUXT_PUBLIC_APP_NAME: string
    NODE_ENV: 'development' | 'production' | 'test'
    APP_BASE_URL: string
    SMTP_HOST: string
    SMTP_PORT: number
    SMTP_SECURE: boolean
    SMTP_USER: string
    SMTP_PASSWORD: string
    MAIL_FROM: string
    USER_INVITATION_TTL_HOURS: number
}

const envSchema = Joi.object<AppEnv>({
    DATABASE_URL: Joi.string()
        .uri({ scheme: ['postgres', 'postgresql'] })
        .required(),
    // Solo la usa el CLI de Prisma (migrate, diff, studio) a través de prisma.config.ts.
    // En Supabase debe apuntar a la conexión directa o al session pooler, nunca al
    // pooler en modo transacción, que no admite DDL.
    DIRECT_DATABASE_URL: Joi.string()
        .uri({ scheme: ['postgres', 'postgresql'] })
        .optional(),
    JWT_SECRET: Joi.string().min(32).required(),
    PORT: Joi.number().integer().min(1).max(65535).default(3000),
    NUXT_PUBLIC_APP_NAME: Joi.string().min(1).required(),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    APP_BASE_URL: Joi.string().uri().default('http://127.0.0.1:3000'),
    SMTP_HOST: Joi.string().min(1).default('127.0.0.1'),
    SMTP_PORT: Joi.number().integer().min(1).max(65535).default(1025),
    SMTP_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
    SMTP_USER: Joi.string().allow('').default(''),
    SMTP_PASSWORD: Joi.string().allow('').default(''),
    MAIL_FROM: Joi.string().min(1).default('Elim <no-reply@elim.local>'),
    USER_INVITATION_TTL_HOURS: Joi.number().integer().min(1).max(168).default(24),
}).unknown(true)

let validatedEnv: AppEnv | null = null

export function validateEnv(): AppEnv {
    if (validatedEnv) {
        return validatedEnv
    }

    const { error, value } = envSchema.validate(process.env, {
        abortEarly: false,
        convert: true,
    })

    if (error) {
        const details = error.details.map((detail) => `- ${detail.message}`).join('\n')
        throw new Error(`Environment validation failed:\n${details}`)
    }

    validatedEnv = { ...value } as AppEnv

    return validatedEnv
}
