export type MfaMethod = 'NONE' | 'TOTP' | 'EMAIL'

export interface MfaStatus {
    method: MfaMethod
    email: string
    recoveryCodesRemaining: number
    phoneAvailable: boolean
}

export interface MfaChallenge {
    challengeToken: string
    expiresIn: number
}

export interface TotpSetup {
    secret: string
    otpauthUri: string
    expiresIn: number
}

export interface TotpRecoveryCodes {
    recoveryCodes: string[]
}

export interface MfaPasswordPayload {
    password: string
}

export interface MfaChallengePayload {
    challengeToken: string
    code: string
}

export interface DisableMfaPayload {
    code: string
    password?: string
    challengeToken?: string
}
