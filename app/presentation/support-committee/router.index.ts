import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

const meta = {
    layout: 'dashboard',
    requiresAuth: true,
    requiredPermission: routePermissionCodes.financeReceive,
} as const

export default [
    {
        name: 'support-committee',
        path: '/finanzas/comite-de-apoyo',
        component: () => import('~/presentation/support-committee/view/SupportCommitteeView.vue'),
        meta,
    },
    {
        name: 'support-committee-received',
        path: '/finanzas/comite-de-apoyo/recibidos',
        component: () => import('~/presentation/support-committee/view/ReceivedEnvelopesView.vue'),
        meta,
    },
    {
        name: 'support-committee-general-services',
        path: '/finanzas/comite-de-apoyo/cultos-generales',
        component: () => import('~/presentation/support-committee/view/GeneralServicesView.vue'),
        meta,
    },
    {
        name: 'support-committee-tithes',
        path: '/finanzas/comite-de-apoyo/diezmos',
        component: () => import('~/presentation/support-committee/view/TitheReceptionView.vue'),
        meta,
    },
    {
        name: 'support-committee-count',
        path: '/finanzas/comite-de-apoyo/sobres/:occurrenceId/contar',
        component: () => import('~/presentation/support-committee/view/EnvelopeCountView.vue'),
        meta,
    },
    {
        name: 'support-committee-review',
        path: '/finanzas/comite-de-apoyo/sobres/:occurrenceId/revisar',
        component: () => import('~/presentation/support-committee/view/EnvelopeReviewView.vue'),
        meta,
    },
    {
        name: 'support-committee-envelope',
        path: '/finanzas/comite-de-apoyo/sobres/:occurrenceId',
        component: () => import('~/presentation/support-committee/view/EnvelopeDetailView.vue'),
        meta,
    },
]
