import { defineStore } from 'pinia'
import type { AuthUser } from '../interfaces/login-response.interface'

const STORAGE_KEY = 'auth-user'

function loadFromStorage(): AuthUser | null {
    if (!import.meta.client) return null
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
        return null
    }
}

function computeInitials(source: string | null | undefined): string {
    if (!source) return 'US'
    const parts = source.split(/[@.\s_-]+/).filter(Boolean)
    if (parts.length >= 2) {
        return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
    }
    return source.slice(0, 2).toUpperCase()
}

interface AuthState {
    user: AuthUser | null
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: loadFromStorage(),
    }),
    getters: {
        displayName(state): string {
            return state.user?.username || state.user?.email || 'Invitado'
        },
        initials(state): string {
            return computeInitials(state.user?.username ?? state.user?.email ?? null)
        },
        isAuthenticated(state): boolean {
            return !!state.user
        },
    },
    actions: {
        setUser(user: AuthUser) {
            this.user = user
            if (import.meta.client) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
            }
        },
        clearUser() {
            this.user = null
            if (import.meta.client) {
                localStorage.removeItem(STORAGE_KEY)
            }
        },
    },
})
