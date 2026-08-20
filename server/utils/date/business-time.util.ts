/// Zona horaria oficial de la operación. No se usa la zona del servidor porque
/// puede ser distinta entre desarrollo, contenedores y producción.
export const BUSINESS_TIME_ZONE = 'America/El_Salvador'

const businessDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
})

function requiredPart(parts: Record<string, string>, name: string) {
    const value = parts[name]
    if (value === undefined) throw new Error(`No se pudo obtener ${name} en la hora oficial`)
    return value
}

/// Fecha y hora de un instante expresadas como valores comparables en la zona oficial.
export function businessDateTime(now = new Date()) {
    const parts = Object.fromEntries(
        businessDateTimeFormatter
            .formatToParts(now)
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, part.value]),
    )
    const year = requiredPart(parts, 'year')
    const month = requiredPart(parts, 'month')
    const day = requiredPart(parts, 'day')
    const hour = requiredPart(parts, 'hour')
    const minute = requiredPart(parts, 'minute')
    const second = requiredPart(parts, 'second')

    return {
        date: `${year}-${month}-${day}`,
        time: `${hour}:${minute}:${second}`,
    }
}

export function businessIsoDate(now = new Date()) {
    return businessDateTime(now).date
}

export interface ScheduledOccurrenceTime {
    date: string
    startTime: string
    endTime: string
}

function nextIsoDate(isoDate: string) {
    const [year, month, day] = isoDate.split('-').map(Number)
    const next = new Date(Date.UTC(year!, month! - 1, day! + 1))
    return next.toISOString().slice(0, 10)
}

/**
 * Una ocurrencia se habilita al alcanzar su hora de fin, nunca por el solo hecho
 * de haber comenzado el día. También tolera reuniones que crucen medianoche.
 */
export function hasOccurrenceEnded(occurrence: ScheduledOccurrenceTime, now = new Date()) {
    const startTime = occurrence.startTime.slice(0, 5)
    const endTime = occurrence.endTime.slice(0, 5)
    const endDate = endTime <= startTime ? nextIsoDate(occurrence.date) : occurrence.date
    const current = businessDateTime(now)

    return `${current.date}T${current.time}` >= `${endDate}T${endTime}:00`
}
