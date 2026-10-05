export function normalizeHexColor(value: string | null | undefined) {
    const trimmed = value?.trim() ?? ''
    const candidate = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate.toLowerCase() : null
}

export function contrastColor(color: string) {
    const normalized = normalizeHexColor(color)
    if (!normalized) return '#FFFFFF'
    const red = Number.parseInt(normalized.slice(1, 3), 16)
    const green = Number.parseInt(normalized.slice(3, 5), 16)
    const blue = Number.parseInt(normalized.slice(5, 7), 16)
    return (red * 299 + green * 587 + blue * 114) / 1000 > 155 ? '#211A16' : '#FFFFFF'
}

export function firstUnusedColor(palette: readonly string[], usedColors: readonly string[]) {
    const used = new Set(usedColors.map((color) => color.toLowerCase()))
    return palette.find((color) => !used.has(color.toLowerCase())) ?? palette[0] ?? '#e9c176'
}
