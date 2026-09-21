export function useTourProgress(tourId: string, version: number) {
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
        } catch {
            // El recorrido sigue funcionando aunque el navegador bloquee el almacenamiento.
        }
    }

    return { hasSeen, markSeen }
}
