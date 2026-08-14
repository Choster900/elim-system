import { accessSectionPermissions } from '~/presentation/access-control/constants/access-control.constants'
import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

export default [
    {
        name: 'users',
        path: '/comunidad/usuarios',
        component: () => import('~/presentation/access-control/view/AccessManagementView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.usersView,
            sectionPermissions: accessSectionPermissions,
        },
    },
]
