import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

const baseMeta = {
    layout: 'dashboard',
    requiresAuth: true,
} as const

const envelopeMeta = {
    ...baseMeta,
    requiredAnyPermissions: [
        routePermissionCodes.financeReceive,
        routePermissionCodes.supportCommitteeGeneralServices,
        routePermissionCodes.supportCommitteeReceived,
    ],
}

export default [
    {
        name: 'support-committee',
        path: '/finanzas/comite-de-apoyo',
        component: () => import('~/presentation/support-committee/view/SupportCommitteeView.vue'),
        meta: { ...baseMeta, requiredPermission: routePermissionCodes.financeReceive },
    },
    {
        name: 'support-committee-received',
        path: '/finanzas/comite-de-apoyo/recibidos',
        component: () => import('~/presentation/support-committee/view/ReceivedEnvelopesView.vue'),
        meta: { ...baseMeta, requiredPermission: routePermissionCodes.supportCommitteeReceived },
    },
    {
        name: 'support-committee-general-services',
        path: '/finanzas/comite-de-apoyo/cultos-generales',
        component: () => import('~/presentation/support-committee/view/GeneralServicesView.vue'),
        meta: {
            ...baseMeta,
            requiredPermission: routePermissionCodes.supportCommitteeGeneralServices,
        },
    },
    {
        name: 'support-committee-tithes',
        path: '/finanzas/comite-de-apoyo/diezmos',
        component: () => import('~/presentation/support-committee/view/TitheReceptionView.vue'),
        meta: { ...baseMeta, requiredPermission: routePermissionCodes.tithesView },
    },
    {
        name: 'support-committee-count',
        path: '/finanzas/comite-de-apoyo/sobres/:occurrenceId/contar',
        component: () => import('~/presentation/support-committee/view/EnvelopeCountView.vue'),
        meta: envelopeMeta,
    },
    {
        name: 'support-committee-review',
        path: '/finanzas/comite-de-apoyo/sobres/:occurrenceId/revisar',
        component: () => import('~/presentation/support-committee/view/EnvelopeReviewView.vue'),
        meta: envelopeMeta,
    },
    {
        name: 'support-committee-envelope',
        path: '/finanzas/comite-de-apoyo/sobres/:occurrenceId',
        component: () => import('~/presentation/support-committee/view/EnvelopeDetailView.vue'),
        meta: envelopeMeta,
    },
]
