export function nextSequentialCode(prefix: string, existingCodes: string[], padding = 3) {
    const pattern = new RegExp(`^${prefix}-(\\d+)$`)
    const maximum = existingCodes.reduce((current, code) => {
        const match = pattern.exec(code)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)

    return `${prefix}-${String(maximum + 1).padStart(padding, '0')}`
}

function compact(value: string) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function buildMeetingCode(sectorCode: string, meetingId: number, isoDate: string) {
    const sector = compact(sectorCode) || 'SEC000'
    const number = String(meetingId).padStart(4, '0')
    const date = isoDate.slice(0, 10).replace(/-/g, '')

    return `${sector}-REU${number}-${date}`
}
