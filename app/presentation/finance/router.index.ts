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
            requiredPermission: routePermissionCodes.financeRecord,
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
        // Pantalla propia de captura: registrar no cabía en un panel lateral.
        name: 'offering-capture',
        path: '/finanzas/ofrendas/registrar/:meetingId',
        component: () => import('~/presentation/finance/view/OccurrenceCaptureView.vue'),
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
        // Se conserva para enlaces compartidos y marcadores anteriores.
        name: 'my-meetings',
        path: '/finanzas/ofrendas/mis-reuniones',
        redirect: '/finanzas/ofrendas',
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.financeRecord,
        },
    },
]
