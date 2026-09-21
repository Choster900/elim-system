import {
    createCipheriv,
    createDecipheriv,
    createHmac,
    hkdfSync,
    randomBytes,
    randomInt,
    timingSafeEqual,
} from 'node:crypto'
import { validateEnv } from '../../../config/env'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const TOTP_PERIOD_SECONDS = 30

function key(purpose: string) {
    return Buffer.from(
        hkdfSync('sha256', validateEnv().JWT_SECRET, '', `elim:mfa:${purpose}:v1`, 32),
    )
}

function encodeBase32(bytes: Buffer) {
    let bits = 0
    let value = 0
    let result = ''
    for (const byte of bytes) {
        value = (value << 8) | byte
        bits += 8
        while (bits >= 5) {
            result += BASE32[(value >>> (bits -= 5)) & 31]
        }
    }
    if (bits) result += BASE32[(value << (5 - bits)) & 31]
    return result
}

function decodeBase32(input: string) {
    const normalized = input.replace(/\s|-/g, '').toUpperCase().replace(/=+$/, '')
    if (!normalized || /[^A-Z2-7]/.test(normalized)) return null
    let bits = 0
    let value = 0
    const bytes: number[] = []
    for (const character of normalized) {
        value = (value << 5) | BASE32.indexOf(character)
        bits += 5
        if (bits >= 8) {
            bytes.push((value >>> (bits -= 8)) & 255)
        }
    }
    return Buffer.from(bytes)
}

export function createTotpSecret() {
    return encodeBase32(randomBytes(20))
}

export function buildTotpUri(secret: string, email: string) {
    const label = encodeURIComponent(`Elim:${email}`)
    return `otpauth://totp/${label}?secret=${secret}&issuer=Elim&algorithm=SHA1&digits=6&period=30`
}

export function encryptTotpSecret(secret: string) {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', key('totp-encryption'), iv)
    const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
    return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.')
}

export function decryptTotpSecret(encrypted: string) {
    const parts = encrypted.split('.')
    if (parts.length !== 3) throw new Error('Secreto TOTP inválido')
    const [iv, tag, ciphertext] = parts.map((part) => Buffer.from(part, 'base64url'))
    const decipher = createDecipheriv('aes-256-gcm', key('totp-encryption'), iv!)
    decipher.setAuthTag(tag!)
    return Buffer.concat([decipher.update(ciphertext!), decipher.final()]).toString('utf8')
}

function totpAtStep(secret: Buffer, step: number) {
    const counter = Buffer.alloc(8)
    counter.writeBigUInt64BE(BigInt(step))
    const digest = createHmac('sha1', secret).update(counter).digest()
    const offset = digest[digest.length - 1]! & 15
    return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, '0')
}

export function matchingTotpStep(secret: string, code: string, now = Date.now()) {
    if (!/^\d{6}$/.test(code)) return null
    const decoded = decodeBase32(secret)
    if (!decoded) return null
    const step = Math.floor(now / 1000 / TOTP_PERIOD_SECONDS)
    for (const candidate of [step - 1, step, step + 1]) {
        const expected = totpAtStep(decoded, candidate)
        if (timingSafeEqual(Buffer.from(code), Buffer.from(expected))) return candidate
    }
    return null
}

export function createEmailCode() {
    return String(randomInt(0, 100_000_000)).padStart(8, '0')
}

export function createRecoveryCodes() {
    return Array.from({ length: 8 }, () => randomBytes(8).toString('hex').toUpperCase())
}

export function hashMfaValue(value: string) {
    return createHmac('sha256', key('code-hash')).update(value).digest('hex')
}

export function sameMfaHash(actual: string | null, expected: string) {
    if (!actual || actual.length !== expected.length) return false
    return timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
}
