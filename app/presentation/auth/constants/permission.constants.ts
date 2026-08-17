export const SYSTEM_PERMISSION_CODE = 'system.manage'

export const routePermissionCodes = {
    dashboard: 'dashboard.view',
    membersView: 'members.view',
    membersCreate: 'members.create',
    meetingsView: 'meetings.view',
    meetingsManage: 'meetings.manage',
    financeView: 'finance.view',
    financeManage: 'finance.manage',
    territoriesView: 'territories.view',
    usersView: 'users.view',
    usersCreate: 'users.create',
    usersUpdate: 'users.update',
    usersBlock: 'users.block',
    rolesView: 'roles.view',
    permissionsView: 'permissions.view',
} as const
