export default [
    {
        name: 'login',
        path: '/login',
        component: () => import('~/presentation/auth/view/index.vue'),
        meta: {
            layout: 'auth',
        },
    },
]
