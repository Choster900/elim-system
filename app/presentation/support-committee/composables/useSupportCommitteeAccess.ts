import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'

export function useSupportCommitteeAccess() {
    const authStore = useAuthStore()
    const allows = (permission: string) => computed(() => authStore.hasPermission(permission))

    return {
        canReceivePending: allows(routePermissionCodes.financeReceive),
        canHandleGeneralServices: allows(routePermissionCodes.supportCommitteeGeneralServices),
        canViewReceived: allows(routePermissionCodes.supportCommitteeReceived),
        canViewTithes: allows(routePermissionCodes.tithesView),
        canCreateTithes: allows(routePermissionCodes.tithesCreate),
        canUpdateTithes: allows(routePermissionCodes.tithesUpdate),
        canDeleteTithes: allows(routePermissionCodes.tithesDelete),
    }
}
