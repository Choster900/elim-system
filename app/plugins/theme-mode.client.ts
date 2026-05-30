import { useThemeMode } from '~/presentation/shared/composables/useThemeMode'

export default defineNuxtPlugin(() => {
    const { initializeMode } = useThemeMode()
    initializeMode()
})
