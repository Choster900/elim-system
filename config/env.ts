import Joi from 'joi'

export interface AppEnv {
    DATABASE_URL: string
    JWT_SECRET: string
    PORT: number
    NUXT_PUBLIC_APP_NAME: string
    NODE_ENV: 'development' | 'production' | 'test'
}

const envSchema = Joi.object<AppEnv>({
    DATABASE_URL: Joi.string()
        .uri({ scheme: ['postgres', 'postgresql'] })
        .required(),
    JWT_SECRET: Joi.string().min(32).required(),
    PORT: Joi.number().integer().min(1).max(65535).default(3000),
    NUXT_PUBLIC_APP_NAME: Joi.string().min(1).required(),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
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
