import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

const meta = {
    layout: 'dashboard',
    requiresAuth: true,
    requiredPermission: routePermissionCodes.financeAudit,
} as const

export default [
    {
        name: 'offering-reconciliation',
        path: '/finanzas/conciliacion',
        component: () =>
            import('~/presentation/offering-reconciliation/view/ReconciliationSummaryView.vue'),
        meta,
    },
    {
        name: 'offering-reconciliation-envelopes',
        path: '/finanzas/conciliacion/sobres',
        component: () =>
            import('~/presentation/offering-reconciliation/view/ReconciliationEnvelopesView.vue'),
        meta,
    },
    {
        name: 'offering-reconciliation-leaders',
        path: '/finanzas/conciliacion/lideres',
        component: () =>
            import('~/presentation/offering-reconciliation/view/ReconciliationLeadersView.vue'),
        meta,
    },
    {
        name: 'offering-reconciliation-envelope',
        path: '/finanzas/conciliacion/sobres/:occurrenceId',
        component: () =>
            import('~/presentation/offering-reconciliation/view/ReconciliationEnvelopeDetailView.vue'),
        meta,
    },
]
