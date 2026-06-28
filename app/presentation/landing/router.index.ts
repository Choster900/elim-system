export default [
    {
        name: 'index',
        path: '/',
        component: () => import('~/presentation/landing/view/index.vue'),
        meta: {
            layout: 'public',
        },
    },
]
