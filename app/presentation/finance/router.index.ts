import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

export default [
    {
        // La bandeja de pendientes es la entrada del módulo: la pregunta es «qué me falta».
        name: 'offerings',
        path: '/finanzas/ofrendas',
        component: () => import('~/presentation/finance/view/PendingOfferingsView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.financeView,
        },
    },
    {
        name: 'offering-history',
        path: '/finanzas/ofrendas/historial',
        component: () => import('~/presentation/finance/view/OfferingHistoryView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.financeView,
        },
    },
    {
        name: 'offering-bulk-record',
        path: '/finanzas/ofrendas/registro-global',
        component: () => import('~/presentation/finance/view/BulkOfferingMatrixView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.financeRecord,
        },
    },
    {
        name: 'meeting-offering-history',
        path: '/finanzas/ofrendas/reunion/:id',
        component: () => import('~/presentation/finance/view/MeetingOfferingHistoryView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.financeView,
        },
    },
    {
        // Vista del líder: sus reuniones y nada más.
        name: 'my-meetings',
        path: '/finanzas/mis-reuniones',
        component: () => import('~/presentation/finance/view/MyMeetingsView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.financeRecord,
        },
    },
]
