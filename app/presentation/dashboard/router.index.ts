import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

export default [
    {
        name: 'dashboard',
        path: '/dashboard',
        component: () => import('~/presentation/dashboard/view/DashboardView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.dashboard,
        },
    },
]
