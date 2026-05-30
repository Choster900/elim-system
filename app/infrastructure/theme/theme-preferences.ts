import type { ThemeMode } from './theme-mode.type'

const THEME_STORAGE_KEY = 'app-theme-mode'
const DEFAULT_THEME_MODE: ThemeMode = 'light'

function isThemeMode(value: string | null): value is ThemeMode {
    return value === 'light' || value === 'dark'
}

export function saveThemeMode(mode: ThemeMode) {
    if (!import.meta.client) {
        return
    }

    localStorage.setItem(THEME_STORAGE_KEY, mode)
}

export function resolveInitialThemeMode(): ThemeMode {
    if (!import.meta.client) {
        return DEFAULT_THEME_MODE
    }

    const storedMode = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeMode(storedMode)) {
        return storedMode
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : DEFAULT_THEME_MODE
}
