export function formatInitials(source: string | null | undefined, fallback = '', maxLength = 2) {
    const normalizedSource = source?.trim()
    if (!normalizedSource) {
        return fallback
    }

    const parts = normalizedSource.split(/[@.\s_-]+/).filter(Boolean)
    if (parts.length >= 2) {
        return parts
            .slice(0, maxLength)
            .map((part) => part[0])
            .join('')
            .toUpperCase()
    }

    return normalizedSource.slice(0, maxLength).toUpperCase()
}

export function formatValidationMessage(message: string) {
    const normalizedMessage = message.replace(/^"[^"]+"\s*/, '').trim()
    if (!normalizedMessage) {
        return ''
    }

    return normalizedMessage.charAt(0).toUpperCase() + normalizedMessage.slice(1)
}

export function normalizeSearchText(value: unknown) {
    return String(value ?? '')
        .trim()
        .toLocaleLowerCase('es')
}

export function toDisplayString(value: unknown) {
    return value == null ? '' : String(value)
}
