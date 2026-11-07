/// <reference types="node" />
import process from 'node:process'
import Joi from 'joi'

export interface AppEnv {
    DATABASE_URL: string
    DIRECT_DATABASE_URL?: string
    JWT_SECRET: string
    PORT?: number
    NUXT_PUBLIC_APP_NAME: string
    NUXT_PUBLIC_MAP_PROVIDER: 'carto-dark' | 'carto-light' | 'openstreetmap' | 'custom'
    NUXT_PUBLIC_MAP_TILE_URL: string
    NUXT_PUBLIC_MAP_ATTRIBUTION: string
    NUXT_PUBLIC_MAP_API_KEY: string
    NUXT_PUBLIC_APP_TOUR_ENABLED: boolean
    NODE_ENV: 'development' | 'production' | 'test'
    APP_BASE_URL: string
    CORS_ALLOWED_ORIGINS: string
    SMTP_HOST: string
    SMTP_PORT: number
    SMTP_SECURE: boolean
    SMTP_USER: string
    SMTP_PASSWORD: string
    MAIL_FROM: string
    PASSWORD_RESET_TTL_HOURS: number
}

export function parseCorsOrigins(value: string) {
    return value
        .split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean)
}

const envSchema = Joi.object<AppEnv>({
    DATABASE_URL: Joi.string()
        .uri({ scheme: ['postgres', 'postgresql'] })
        .required(),
    DIRECT_DATABASE_URL: Joi.string()
        .uri({ scheme: ['postgres', 'postgresql'] })
        .optional(),
    JWT_SECRET: Joi.string().min(32).required(),
    PORT: Joi.number().integer().min(1).max(65535).optional(),
    NUXT_PUBLIC_APP_NAME: Joi.string().min(1).required(),
    NUXT_PUBLIC_MAP_PROVIDER: Joi.string()
        .valid('carto-dark', 'carto-light', 'openstreetmap', 'custom')
        .default('carto-light'),
    NUXT_PUBLIC_MAP_TILE_URL: Joi.string().allow('').default(''),
    NUXT_PUBLIC_MAP_ATTRIBUTION: Joi.string().allow('').default(''),
    NUXT_PUBLIC_MAP_API_KEY: Joi.string().allow('').default(''),
    NUXT_PUBLIC_APP_TOUR_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    APP_BASE_URL: Joi.string().uri().default('http://127.0.0.1:3000'),
    CORS_ALLOWED_ORIGINS: Joi.string()
        .allow('')
        .default('')
        .custom((value: string, helpers) => {
            const invalid = parseCorsOrigins(value).find(
                (origin) => !/^https?:\/\/[^/\s]+$/.test(origin),
            )
            return invalid ? helpers.error('string.corsOrigin', { origin: invalid }) : value
        })
        .messages({
            'string.corsOrigin':
                'CORS_ALLOWED_ORIGINS has an invalid origin "{{#origin}}"; use scheme://host[:port] entries separated by commas',
        }),
    SMTP_HOST: Joi.string().min(1).default('127.0.0.1'),
    SMTP_PORT: Joi.number().integer().min(1).max(65535).default(1025),
    SMTP_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
    SMTP_USER: Joi.string().allow('').default(''),
    SMTP_PASSWORD: Joi.string().allow('').default(''),
    MAIL_FROM: Joi.string().min(1).default('Elim <no-reply@elim.local>'),
    PASSWORD_RESET_TTL_HOURS: Joi.number().integer().min(1).max(24).default(2),
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
