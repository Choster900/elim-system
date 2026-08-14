import { accessPermissionsMock, accessRolesMock } from '../mocks/access-control.mock'

export function useAccessControlPreview() {
    const roles = useState('access-control-preview-roles', () =>
        accessRolesMock.map((role) => ({ ...role, permissionIds: [...role.permissionIds] })),
    )
    const permissions = useState('access-control-preview-permissions', () =>
        accessPermissionsMock.map((permission) => ({ ...permission })),
    )

    return { roles, permissions }
}
