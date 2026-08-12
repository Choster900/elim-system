export function readJsonStorage<T>(key: string, fallback: T): T {
    if (!import.meta.client) {
        return fallback
    }

    try {
        const rawValue = localStorage.getItem(key)
        return rawValue === null ? fallback : (JSON.parse(rawValue) as T)
    } catch {
        return fallback
    }
}

export function writeJsonStorage(key: string, value: unknown) {
    if (!import.meta.client) {
        return
    }

    localStorage.setItem(key, JSON.stringify(value))
}

export function removeStorageItem(key: string) {
    if (!import.meta.client) {
        return
    }

    localStorage.removeItem(key)
}
