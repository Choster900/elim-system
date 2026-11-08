import { SYSTEM_PERMISSION_CODE } from '~/presentation/auth/constants/permission.constants'
import { LABEL_PRINTER_ROUTE } from './constants/label-printing.constants'

export default [
    {
        name: 'label-printer-test',
        path: LABEL_PRINTER_ROUTE,
        component: () => import('~/presentation/label-printing/view/LabelPrinterTestView.vue'),
        meta: {
            layout: 'dashboard',
            requiresAuth: true,
            requiredPermission: SYSTEM_PERMISSION_CODE,
        },
    },
]
