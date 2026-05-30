import {
    applyThemeMode,
    resolveInitialThemeMode,
    saveThemeMode,
    type ThemeMode,
} from '~/infrastructure/theme'

export function useThemeMode() {
    const mode = useState<ThemeMode>('theme-mode', () => 'light')
    const isInitialized = useState<boolean>('theme-mode-initialized', () => false)

    const setMode = (nextMode: ThemeMode) => {
        mode.value = nextMode
        applyThemeMode(nextMode)

        saveThemeMode(nextMode)
    }

    const toggleMode = () => {
        const nextMode = mode.value === 'dark' ? 'light' : 'dark'
        setMode(nextMode)
    }

    const initializeMode = () => {
        if (!import.meta.client || isInitialized.value) {
            return
        }

        mode.value = resolveInitialThemeMode()
        applyThemeMode(mode.value)
        isInitialized.value = true
    }

    return {
        mode: readonly(mode),
        setMode,
        toggleMode,
        initializeMode,
    }
}
