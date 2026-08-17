import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

export default [
    {
        name: 'offerings',
        path: '/finanzas/ofrendas',
        component: () => import('~/presentation/finance/view/OfferingsView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.financeView,
        },
    },
    {
        name: 'offering-create',
        path: '/finanzas/ofrendas/nueva',
        component: () => import('~/presentation/finance/view/OfferingFormView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.financeManage,
        },
    },
    {
        name: 'offering-bulk-create',
        path: '/finanzas/ofrendas/registro-global',
        component: () => import('~/presentation/finance/view/BulkOfferingFormView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.financeManage,
        },
    },
    {
        name: 'offering-edit',
        path: '/finanzas/ofrendas/:id/editar',
        component: () => import('~/presentation/finance/view/OfferingFormView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.financeManage,
        },
    },
]
