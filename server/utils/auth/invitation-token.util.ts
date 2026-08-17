import { createHash, randomBytes, randomInt } from 'node:crypto'

const TEMPORARY_PASSWORD_GROUPS = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!@#$%&*?',
] as const
const TEMPORARY_PASSWORD_ALPHABET = TEMPORARY_PASSWORD_GROUPS.join('')

function randomCharacter(alphabet: string) {
    return alphabet[randomInt(0, alphabet.length)]!
}

export function generateInvitationToken() {
    return randomBytes(32).toString('base64url')
}

export function hashInvitationToken(token: string) {
    return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function generateTemporaryPassword(length = 16) {
    const characters = TEMPORARY_PASSWORD_GROUPS.map(randomCharacter)
    while (characters.length < length) {
        characters.push(randomCharacter(TEMPORARY_PASSWORD_ALPHABET))
    }

    for (let index = characters.length - 1; index > 0; index -= 1) {
        const swapIndex = randomInt(0, index + 1)
        ;[characters[index], characters[swapIndex]] = [characters[swapIndex]!, characters[index]!]
    }

    return characters.join('')
}
