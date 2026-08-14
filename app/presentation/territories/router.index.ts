import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

export default [
    {
        name: 'territories',
        path: '/catalogos/distritos',
        component: () => import('~/presentation/territories/view/TerritoriesView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.territoriesView,
        },
    },
]
