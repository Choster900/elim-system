import { normalizeDui } from '#shared/utils/dui.util'

const DUI_DIGITS = 9

export function formatDuiInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, DUI_DIGITS)
    return digits.length < DUI_DIGITS ? digits : normalizeDui(digits)
}
