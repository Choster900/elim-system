import type { H3Event } from 'h3'
import { hasPermission, requirePermission } from './require-permission.util'

export const RECEPTION_PENDING_PERMISSION = 'finance.receive'
export const RECEPTION_GENERAL_SERVICES_PERMISSION = 'support-committee.general_services'
export const RECEPTION_RECEIVED_PERMISSION = 'support-committee.received'

export interface ReceptionAccess {
    pending: boolean
    generalServices: boolean
    received: boolean
}

export function requireReceptionAccess(event: H3Event) {
    const auth = requirePermission(event, [
        RECEPTION_PENDING_PERMISSION,
        RECEPTION_GENERAL_SERVICES_PERMISSION,
        RECEPTION_RECEIVED_PERMISSION,
    ])
    const access: ReceptionAccess = {
        pending: hasPermission(auth, RECEPTION_PENDING_PERMISSION),
        generalServices: hasPermission(auth, RECEPTION_GENERAL_SERVICES_PERMISSION),
        received: hasPermission(auth, RECEPTION_RECEIVED_PERMISSION),
    }
    return { auth, access }
}
