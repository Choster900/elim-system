import { defineStore } from 'pinia'
import { formatInitials } from '~/utils/string/text-format.util'
import {
    readJsonStorage,
    removeStorageItem,
    writeJsonStorage,
} from '~/utils/storage/json-storage.util'
import type { AuthUser } from '../interfaces/login-response.interface'
import { SYSTEM_PERMISSION_CODE } from '../constants/permission.constants'

const STORAGE_KEY = 'auth-user'

interface AuthState {
    user: AuthUser | null
    sessionChecked: boolean
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: readJsonStorage<AuthUser | null>(STORAGE_KEY, null),
        sessionChecked: false,
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
        permissionCodes(state): string[] {
            return state.user?.permissions.map((permission) => permission.code) ?? []
        },
        hasPermission(state) {
            const permissionCodes = new Set(
                state.user?.permissions.map((permission) => permission.code) ?? [],
            )

            return (permissionCode: string) =>
                permissionCodes.has(SYSTEM_PERMISSION_CODE) || permissionCodes.has(permissionCode)
        },
    },
    actions: {
        setUser(user: AuthUser) {
            this.user = user
            this.sessionChecked = true
            writeJsonStorage(STORAGE_KEY, user)
        },
        clearUser() {
            this.user = null
            this.sessionChecked = true
            removeStorageItem(STORAGE_KEY)
        },
    },
})
