import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { AuthUser } from '~/presentation/auth/interfaces/login-response.interface'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import type { RouteLocationNormalized } from 'vue-router'

function resolveRequiredPermission(to: RouteLocationNormalized) {
    const section = typeof to.query.section === 'string' ? to.query.section : null
    if (section && to.meta.sectionPermissions?.[section]) {
        return to.meta.sectionPermissions[section]
    }

    return to.meta.requiredPermission
}

export default defineNuxtRouteMiddleware(async (to) => {
    const authStore = useAuthStore()

    if (!to.meta.requiresAuth) {
        if (
            authStore.sessionChecked &&
            authStore.user?.mustChangePassword &&
            to.path !== '/cambiar-clave'
        ) {
            return navigateTo({
                path: '/cambiar-clave',
                query: { redirect: to.fullPath },
            })
        }
        return
    }

    if (!authStore.sessionChecked) {
        try {
            const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
            const response = await $fetch<ApiResponse<AuthUser>>('/api/auth/me', { headers })

            if (!response.success || !response.data) throw new Error('Invalid auth response')
            authStore.setUser(response.data)
        } catch {
            useNuxtApp().$queryClient.clear()
            authStore.clearUser()
        }
    }

    if (!authStore.isAuthenticated) {
        return navigateTo({
            path: '/login',
            query: { redirect: to.fullPath },
        })
    }

    if (authStore.user?.mustChangePassword && to.path !== '/cambiar-clave') {
        return navigateTo({
            path: '/cambiar-clave',
            query: { redirect: to.fullPath },
        })
    }

    if (!authStore.user?.mustChangePassword && to.path === '/cambiar-clave') {
        return navigateTo('/dashboard')
    }

    const requiredPermission = resolveRequiredPermission(to)
    if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
        return navigateTo({
            path: '/acceso-denegado',
            query: {
                from: to.fullPath,
                permission: requiredPermission,
            },
            replace: true,
        })
    }
})
