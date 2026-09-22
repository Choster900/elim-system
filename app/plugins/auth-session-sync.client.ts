import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { subscribeToAuthSessionEvents } from '~/presentation/auth/utils/auth-session-sync.util'

export default defineNuxtPlugin({
    name: 'auth-session-sync',
    dependsOn: ['vue-query'],
    setup() {
        const authStore = useAuthStore()
        const route = useRoute()
        const { $queryClient: queryClient } = useNuxtApp()

        subscribeToAuthSessionEvents((event) => {
            if (event.type === 'SIGNED_IN') {
                if (authStore.user?.id !== event.user.id) {
                    queryClient.clear()
                }
                authStore.setUserFromExternalSession(event.user, event.sessionExpiresAt)
                if (route.path === '/login') {
                    void navigateTo(event.user.mustChangePassword ? '/cambiar-clave' : '/dashboard')
                }
                return
            }

            queryClient.clear()
            authStore.clearUserFromExternalSession()
            if (route.meta.requiresAuth) {
                void navigateTo({
                    path: '/login',
                    query: { redirect: route.fullPath },
                })
            }
        })
    },
})
