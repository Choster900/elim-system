export function nextSequentialCode(
    prefix: string,
    existingCodes: string[],
    padding = 3,
    separator = '-',
) {
    const pattern = new RegExp(`^${prefix}${separator}(\\d+)$`)
    const maximum = existingCodes.reduce((current, code) => {
        const match = pattern.exec(code)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)

    return `${prefix}${separator}${String(maximum + 1).padStart(padding, '0')}`
}

function compact(value: string) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function nextMeetingCode(
    districtCode: string,
    zoneCode: string,
    sectorCode: string,
    typeSegment: string,
    existingCodes: string[],
) {
    const prefix = [districtCode, zoneCode, sectorCode, typeSegment].map(compact).join('')
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`^${escapedPrefix}(\\d+)$`)
    const maximum = existingCodes.reduce((current, code) => {
        const match = pattern.exec(code)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)

    return `${prefix}${maximum + 1}`
}
