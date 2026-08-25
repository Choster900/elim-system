const DUI_DIGITS = 9
const DUI_PATTERN = /^\d{8}-\d$/

function formatDigits(digits: string) {
    return `${digits.slice(0, 8)}-${digits.slice(8)}`
}

export function formatDuiInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, DUI_DIGITS)
    return digits.length <= 8 ? digits : formatDigits(digits)
}

export function normalizeDui(value: string) {
    const trimmed = value.trim()
    const digits = trimmed.includes('-') ? trimmed.replace('-', '') : trimmed
    return /^\d{9}$/.test(digits) ? formatDigits(digits) : trimmed
}

export function isValidDui(value: string) {
    const normalized = normalizeDui(value)
    if (!DUI_PATTERN.test(normalized)) return false

    const digits = normalized.replace('-', '')
    if (/^0{9}$/.test(digits)) return false

    const checksum = digits
        .slice(0, 8)
        .split('')
        .reduce((total, digit, index) => total + Number(digit) * (9 - index), 0)
    const verifier = (10 - (checksum % 10)) % 10

    return verifier === Number(digits[8])
}
