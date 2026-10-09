const NAME_MAX_LENGTH = 100

function withCode(prefix: string, code: string) {
    const room = NAME_MAX_LENGTH - code.length - 1
    const base = prefix.trim().slice(0, Math.max(room, 0)).trim()
    return base ? `${base} ${code}` : code
}

export function districtAutoName(code: string) {
    return code
}

export function zoneAutoName(districtName: string, zoneCode: string) {
    return withCode(districtName, zoneCode)
}

export function sectorAutoName(districtName: string, zoneName: string, sectorCode: string) {
    const zonePart = zoneName.startsWith(districtName) ? zoneName : `${districtName} ${zoneName}`
    return withCode(zonePart, sectorCode)
}

export function meetingAutoTitle(code: string, sectorName: string | null) {
    return sectorName ? withCode(sectorName, code) : code
}
