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
    options: ['members', 'options'] as const,
    meetingLeaders: ['members', 'meeting-leaders'] as const,
}

const territories = {
    all: ['territories'] as const,
    hierarchy: ['territories', 'hierarchy'] as const,
    sectorOptions: ['territories', 'sector-options'] as const,
    supervisors: ['territories', 'supervisors'] as const,
}

const offerings = {
    all: ['offerings'] as const,
    lists: ['offerings', 'list'] as const,
    detail: (id: number) => ['offerings', 'detail', id] as const,
}

const dashboard = {
    all: ['dashboard'] as const,
    summary: (periodDays: number, districtId: number | null) =>
        ['dashboard', 'summary', periodDays, districtId] as const,
}

const offeringCategories = {
    all: ['offering-categories'] as const,
    list: ['offering-categories', 'list'] as const,
}

const users = {
    all: ['users'] as const,
    list: ['users', 'list'] as const,
    catalog: ['users', 'catalog'] as const,
}

const auth = {
    all: ['auth'] as const,
    invitation: (token: string) => ['auth', 'invitation', token] as const,
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
    offerings,
    offeringCategories,
    dashboard,
    users,
    auth,
}
