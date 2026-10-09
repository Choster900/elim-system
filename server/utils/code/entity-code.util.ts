import { territoryPathCode } from '#shared/utils/territory-code.util'

interface SectorPath {
    code: string
    zone: { code: string; district: { code: string } }
}

export function meetingFullCode(code: string, sector: SectorPath | null) {
    if (!sector) return code
    return territoryPathCode(sector.zone.district.code, sector.zone.code, sector.code, code)
}

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

const GENERAL_MEETING_PREFIX = 'IGL'

export function nextMeetingCode(typeSegment: string, existingCodes: string[]) {
    return nextPrefixedCode(compact(typeSegment), existingCodes)
}

export function nextGeneralMeetingCode(typeSegment: string, existingCodes: string[]) {
    return nextPrefixedCode(GENERAL_MEETING_PREFIX + compact(typeSegment), existingCodes)
}

function nextPrefixedCode(prefix: string, existingCodes: string[]) {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`^${escapedPrefix}(\\d+)$`)
    const maximum = existingCodes.reduce((current, code) => {
        const match = pattern.exec(code)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)

    return `${prefix}${maximum + 1}`
}
