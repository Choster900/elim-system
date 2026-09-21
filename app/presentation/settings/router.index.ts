export default [
    {
        name: 'settings',
        path: '/settings',
        component: () => import('~/presentation/settings/view/SettingsView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
        },
    },
]
