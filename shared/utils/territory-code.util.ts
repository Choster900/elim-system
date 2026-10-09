export function territoryPathCode(...codes: Array<string | null | undefined>) {
    return codes.filter(Boolean).join('')
}

export function nextTerritoryCode(prefix: string, existingCodes: string[]) {
    const pattern = new RegExp(`^${prefix}(\\d+)$`)
    const maximum = existingCodes.reduce((current, code) => {
        const match = pattern.exec(code)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)
    return `${prefix}${maximum + 1}`
}
