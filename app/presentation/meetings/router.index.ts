import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

export default [
    {
        name: 'meetings',
        path: '/catalogos/reuniones',
        component: () => import('~/presentation/meetings/view/MeetingsView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.meetingsView,
        },
    },
    {
        name: 'meeting-create',
        path: '/catalogos/reuniones/nueva',
        component: () => import('~/presentation/meetings/view/MeetingFormView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.meetingsManage,
        },
    },
    {
        name: 'meeting-edit',
        path: '/catalogos/reuniones/:id/editar',
        component: () => import('~/presentation/meetings/view/MeetingFormView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.meetingsManage,
        },
    },
]
