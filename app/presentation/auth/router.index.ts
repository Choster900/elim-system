export default [
    {
        name: 'login',
        path: '/login',
        component: () => import('~/presentation/auth/view/index.vue'),
        meta: {
            layout: 'auth',
        },
    },
    {
        name: 'change-password',
        path: '/cambiar-clave',
        component: () => import('~/presentation/auth/view/ChangePasswordView.vue'),
        meta: {
            layout: 'auth',
            requiresAuth: true,
        },
    },
    {
        name: 'access-denied',
        path: '/acceso-denegado',
        component: () => import('~/presentation/auth/view/AccessDeniedView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
        },
    },
]
