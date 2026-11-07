export function useAppTourEnabled() {
    return useRuntimeConfig().public.appTourEnabled === true
}

export function useTourProgress(tourId: string, version: number) {
    const isEnabled = useAppTourEnabled()

    function storageKey(userId: number) {
        return `app-tour:${tourId}:v${version}:user:${userId}`
    }

    function hasSeen(userId: number) {
        if (!import.meta.client) return true
        try {
            return localStorage.getItem(storageKey(userId)) === 'done'
        } catch {
            return false
        }
    }

    function markSeen(userId: number) {
        if (!import.meta.client) return
        try {
            localStorage.setItem(storageKey(userId), 'done')
        } catch {}
    }

    return { isEnabled, hasSeen, markSeen }
}
