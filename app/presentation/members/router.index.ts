import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

export default [
    {
        name: 'member-create',
        path: '/comunidad/miembros/nuevo',
        component: () => import('~/presentation/members/view/MemberFormView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.membersCreate,
        },
    },
    {
        name: 'members',
        path: '/comunidad/miembros',
        component: () => import('~/presentation/members/view/MembersView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.membersView,
        },
    },
]
