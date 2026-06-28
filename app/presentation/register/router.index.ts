export default [
    {
        name: 'register',
        path: '/register',
        component: () => import('~/presentation/register/view/index.vue'),
        meta: {
            layout: 'auth',
        },
    },
]
