import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

export default [
    {
        name: 'meeting-report',
        path: '/reporteria/reuniones',
        component: () => import('~/presentation/reports/view/MeetingReportView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: routePermissionCodes.reportsView,
        },
    },
]
