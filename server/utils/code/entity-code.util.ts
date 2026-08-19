// Códigos de negocio autogenerados. Son identificadores que la gente lee y dicta,
// así que se mantienen cortos, en mayúsculas y sin caracteres ambiguos.

/// Siguiente correlativo de una familia de códigos con el formato PREFIJO-NNN.
export function nextSequentialCode(prefix: string, existingCodes: string[], padding = 3) {
    const pattern = new RegExp(`^${prefix}-(\\d+)$`)
    const maximum = existingCodes.reduce((current, code) => {
        const match = pattern.exec(code)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)

    return `${prefix}-${String(maximum + 1).padStart(padding, '0')}`
}

/// Deja solo letras y dígitos: SEC-008 queda como SEC008 dentro de un código compuesto.
function compact(value: string) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/**
 * Código de una reunión: el sector al que pertenece, su número y su fecha de inicio.
 *
 *   SEC008-REU0015-20260711
 *
 * Se recalcula cuando la reunión cambia de sector o de fecha, así que refleja
 * siempre dónde y cuándo empieza, no dónde nació.
 */
export function buildMeetingCode(sectorCode: string, meetingId: number, isoDate: string) {
    const sector = compact(sectorCode) || 'SEC000'
    const number = String(meetingId).padStart(4, '0')
    const date = isoDate.slice(0, 10).replace(/-/g, '')

    return `${sector}-REU${number}-${date}`
}
