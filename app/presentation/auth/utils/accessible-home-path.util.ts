import { SYSTEM_PERMISSION_CODE, routePermissionCodes } from '../constants/permission.constants'

interface AccessibleRoute {
    path: string
    permission?: string
}

const accessibleRoutes: AccessibleRoute[] = [
    { path: '/dashboard', permission: routePermissionCodes.dashboard },
    { path: '/finanzas/ofrendas', permission: routePermissionCodes.financeRecord },
    { path: '/catalogos/reuniones', permission: routePermissionCodes.meetingsView },
    { path: '/comunidad/miembros', permission: routePermissionCodes.membersView },
    { path: '/territorios', permission: routePermissionCodes.territoriesView },
    { path: '/comunidad/usuarios', permission: routePermissionCodes.usersView },
    { path: '/settings' },
]

function hasPermission(permissionCodes: Iterable<string>, permission?: string) {
    const granted = new Set(permissionCodes)
    return !permission || granted.has(SYSTEM_PERMISSION_CODE) || granted.has(permission)
}

export function resolveAccessibleHomePath(permissionCodes: Iterable<string>) {
    return (
        accessibleRoutes.find((route) => hasPermission(permissionCodes, route.permission))?.path ??
        '/settings'
    )
}

export function resolveAccessibleRedirectPath(
    permissionCodes: Iterable<string>,
    redirect: unknown,
) {
    const requestedPath = typeof redirect === 'string' ? redirect : ''
    const requestedRoute = accessibleRoutes.find((route) => route.path === requestedPath)

    if (requestedRoute && hasPermission(permissionCodes, requestedRoute.permission)) {
        return requestedRoute.path
    }

    return resolveAccessibleHomePath(permissionCodes)
}
