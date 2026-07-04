export default [
    {
        name: 'territories',
        path: '/catalogos/distritos',
        component: () => import('~/presentation/territories/view/TerritoriesView.vue'),
        meta: {
            layout: 'dashboard',
        },
    },
]
