import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'

export default [
    {
        name: 'roles',
        path: '/comunidad/roles',
        redirect: '/comunidad/usuarios?section=roles',
        meta: {
            requiresAuth: true,
            requiredPermission: routePermissionCodes.rolesView,
        },
    },
    {
        name: 'permissions',
        path: '/comunidad/permisos',
        redirect: '/comunidad/usuarios?section=permissions',
        meta: {
            requiresAuth: true,
            requiredPermission: routePermissionCodes.permissionsView,
        },
    },
]
