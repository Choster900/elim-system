import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'
import {
    GENERAL_SERVICES_PATH,
    RECEIVED_ENVELOPES_PATH,
    SUPPORT_COMMITTEE_HOME,
    TITHES_PATH,
} from './reception-format.util'

export const SUPPORT_COMMITTEE_SECTIONS = [
    { path: SUPPORT_COMMITTEE_HOME, permission: routePermissionCodes.financeReceive },
    {
        path: GENERAL_SERVICES_PATH,
        permission: routePermissionCodes.supportCommitteeGeneralServices,
    },
    { path: RECEIVED_ENVELOPES_PATH, permission: routePermissionCodes.supportCommitteeReceived },
    { path: TITHES_PATH, permission: routePermissionCodes.tithesView },
] as const

export const SUPPORT_COMMITTEE_SECTION_PERMISSIONS: string[] = SUPPORT_COMMITTEE_SECTIONS.map(
    (section) => section.permission,
)

export function resolveSupportCommitteeHome(hasPermission: (permission: string) => boolean) {
    return (
        SUPPORT_COMMITTEE_SECTIONS.find((section) => hasPermission(section.permission))?.path ??
        SUPPORT_COMMITTEE_HOME
    )
}
