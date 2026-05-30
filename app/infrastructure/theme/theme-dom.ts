import type { ThemeMode } from './theme-mode.type'

export function applyThemeMode(mode: ThemeMode) {
    if (!import.meta.client) {
        return
    }

    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    root.classList.toggle('light', mode === 'light')
}
