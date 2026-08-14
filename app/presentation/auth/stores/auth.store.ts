import { defineStore } from 'pinia'
import { formatInitials } from '~/utils/string/text-format.util'
import {
    readJsonStorage,
    removeStorageItem,
    writeJsonStorage,
} from '~/utils/storage/json-storage.util'
import type { AuthUser } from '../interfaces/login-response.interface'

const STORAGE_KEY = 'auth-user'

interface AuthState {
    user: AuthUser | null
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: readJsonStorage<AuthUser | null>(STORAGE_KEY, null),
    }),
    getters: {
        displayName(state): string {
            return state.user?.username || state.user?.email || 'Invitado'
        },
        initials(state): string {
            return formatInitials(state.user?.username ?? state.user?.email, 'US')
        },
        isAuthenticated(state): boolean {
            return !!state.user
        },
    },
    actions: {
        setUser(user: AuthUser) {
            this.user = user
            writeJsonStorage(STORAGE_KEY, user)
        },
        clearUser() {
            this.user = null
            removeStorageItem(STORAGE_KEY)
        },
    },
})
