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
// Solo el correo. La contraseña nunca se guarda en el navegador.
const REMEMBERED_EMAIL_KEY = 'auth-remembered-email'

interface AuthState {
    user: AuthUser | null
    sessionChecked: boolean
    rememberedEmail: string | null
    sessionExpiresAt: number | null
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: readJsonStorage<AuthUser | null>(STORAGE_KEY, null),
        sessionChecked: false,
        rememberedEmail: readJsonStorage<string | null>(REMEMBERED_EMAIL_KEY, null),
        sessionExpiresAt: readJsonStorage<number | null>('auth-session-expires-at', null),
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
        setUser(user: AuthUser, accessTokenExpiresIn?: number) {
            const { tokenExpiresAt, ...userWithoutSession } = user
            const expiresAt =
                typeof tokenExpiresAt === 'number'
                    ? tokenExpiresAt * 1000
                    : typeof accessTokenExpiresIn === 'number'
                      ? Date.now() + accessTokenExpiresIn * 1000
                      : this.sessionExpiresAt

            this.user = userWithoutSession
            this.sessionExpiresAt = expiresAt ?? null
            this.sessionChecked = true
            writeJsonStorage(STORAGE_KEY, userWithoutSession)
            writeJsonStorage('auth-session-expires-at', this.sessionExpiresAt)
        },
        clearUser() {
            this.user = null
            this.sessionExpiresAt = null
            this.sessionChecked = true
            removeStorageItem(STORAGE_KEY)
            removeStorageItem('auth-session-expires-at')
        },
        // El correo recordado sobrevive al cierre de sesión: ese es su propósito.
        setRememberedEmail(email: string) {
            const normalizedEmail = email.trim()
            if (!normalizedEmail) {
                this.clearRememberedEmail()
                return
            }

            this.rememberedEmail = normalizedEmail
            writeJsonStorage(REMEMBERED_EMAIL_KEY, normalizedEmail)
        },
        clearRememberedEmail() {
            this.rememberedEmail = null
            removeStorageItem(REMEMBERED_EMAIL_KEY)
        },
    },
})
