import { defineStore } from 'pinia'

interface AppState {
    initializedAt: string | null
}

export const useAppStore = defineStore('app', {
    state: (): AppState => ({
        initializedAt: null,
    }),
    actions: {
        bootstrap() {
            if (!this.initializedAt) {
                this.initializedAt = new Date().toISOString()
            }
        },
    },
})
