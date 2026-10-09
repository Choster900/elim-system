import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { resolveAccessibleHomePath } from '~/presentation/auth/utils/accessible-home-path.util'

export function useAccessAction() {
    const authStore = useAuthStore()

    return computed(() =>
        authStore.isAuthenticated
            ? {
                  label: 'Ingresar',
                  to: resolveAccessibleHomePath(authStore.permissionCodes),
                  isAuthenticated: true,
              }
            : { label: 'Iniciar sesión', to: '/login', isAuthenticated: false },
    )
}
