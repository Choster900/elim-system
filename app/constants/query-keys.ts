const meetings = {
    all: ['meetings'] as const,
    lists: ['meetings', 'list'] as const,
    detail: (id: number) => ['meetings', 'detail', id] as const,
    options: ['meetings', 'options'] as const,
}

const meetingTypes = {
    all: ['meeting-types'] as const,
    list: ['meeting-types', 'list'] as const,
}

const members = {
    all: ['members'] as const,
    list: ['members', 'list'] as const,
    catalogs: ['members', 'catalogs'] as const,
    options: ['members', 'options'] as const,
    meetingLeaders: ['members', 'meeting-leaders'] as const,
    meetingSupervisors: ['members', 'meeting-supervisors'] as const,
    meetingHosts: ['members', 'meeting-hosts'] as const,
}

const territories = {
    all: ['territories'] as const,
    hierarchy: ['territories', 'hierarchy'] as const,
    sectorOptions: ['territories', 'sector-options'] as const,
    leaders: ['territories', 'leaders'] as const,
    coordinators: ['territories', 'coordinators'] as const,
    supervisors: ['territories', 'supervisors'] as const,
}

const occurrences = {
    all: ['occurrences'] as const,
    pending: ['occurrences', 'pending'] as const,
    pendingForCapture: ['occurrences', 'pending', 'capture'] as const,
    pendingMeeting: (id: number) => ['occurrences', 'pending-meeting', id] as const,
    lists: ['occurrences', 'list'] as const,
    list: <TFilters extends object>(filters: TFilters) => ['occurrences', 'list', filters] as const,
    detail: (id: number) => ['occurrences', 'detail', id] as const,
    meetingHistory: (meetingId: number) => ['occurrences', 'meeting', meetingId] as const,
}

const dashboard = {
    all: ['dashboard'] as const,
    summary: (
        periodDays: number,
        districtId: number | null,
        startDate: string | null,
        endDate: string | null,
    ) => ['dashboard', 'summary', periodDays, districtId, startDate, endDate] as const,
}

const attendanceTypes = {
    all: ['attendance-types'] as const,
    list: ['attendance-types', 'list'] as const,
}

const offeringCategories = {
    all: ['offering-categories'] as const,
    list: ['offering-categories', 'list'] as const,
}

const offeringReceptions = {
    all: ['offering-receptions'] as const,
    pending: ['offering-receptions', 'pending'] as const,
    pendingPage: <TParams extends object>(params: TParams) =>
        ['offering-receptions', 'pending', params] as const,
    list: <TFilters extends object>(filters: TFilters) =>
        ['offering-receptions', 'list', filters] as const,
    envelope: (occurrenceId: number) => ['offering-receptions', 'envelope', occurrenceId] as const,
    comparison: <TInput extends object>(occurrenceId: number, input: TInput) =>
        ['offering-receptions', 'comparison', occurrenceId, input] as const,
}

const offeringReconciliation = {
    all: ['offering-reconciliation'] as const,
    summary: <TFilters extends object>(filters: TFilters) =>
        ['offering-reconciliation', 'summary', filters] as const,
    envelope: (occurrenceId: number) =>
        ['offering-reconciliation', 'envelope', occurrenceId] as const,
}

const denominations = {
    all: ['denominations'] as const,
    list: ['denominations', 'list'] as const,
}

const users = {
    all: ['users'] as const,
    list: ['users', 'list'] as const,
    catalog: ['users', 'catalog'] as const,
}

const roles = {
    all: ['roles'] as const,
    list: ['roles', 'list'] as const,
}

const permissions = {
    all: ['permissions'] as const,
    list: ['permissions', 'list'] as const,
}

const auth = {
    all: ['auth'] as const,
    invitation: (token: string) => ['auth', 'invitation', token] as const,
    passwordReset: (token: string) => ['auth', 'password-reset', token] as const,
}

const settings = {
    all: ['settings'] as const,
    mfa: ['settings', 'mfa'] as const,
}

export const queryKeys = {
    app: ['app'] as const,
    system: {
        healthcheck: ['system', 'healthcheck'] as const,
    },
    meetings,
    meetingTypes,
    members,
    territories,
    occurrences,
    attendanceTypes,
    offeringCategories,
    offeringReceptions,
    offeringReconciliation,
    denominations,
    dashboard,
    users,
    roles,
    permissions,
    auth,
    settings,
}
