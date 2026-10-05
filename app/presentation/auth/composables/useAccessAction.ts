import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { resolveAccessibleHomePath } from '~/presentation/auth/utils/accessible-home-path.util'

/**
 * Acción de acceso para páginas públicas: sin sesión lleva a /login; con sesión abierta
 * dice "Ingresar" y lleva a la primera pantalla a la que el usuario tiene permiso.
 */
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
