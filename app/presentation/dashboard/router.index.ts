export default [
    {
        name: 'dashboard',
        path: '/dashboard',
        component: () => import('~/presentation/dashboard/view/DashboardView.vue'),
        meta: {
            layout: 'dashboard',
        },
    },
]
