interface OpenApiOptions {
    appName: string
    appUrl: string
}

export function createOpenApiSpec({ appName, appUrl }: OpenApiOptions) {
    return {
        openapi: '3.0.3',
        info: {
            title: `${appName} API`,
            version: '1.0.0',
            description: 'REST API documentation.',
        },
        servers: [{ url: appUrl }],
        tags: [
            { name: 'Health', description: 'Health check and API documentation' },
            { name: 'Auth', description: 'Authentication and token lifecycle' },
            { name: 'Dashboard', description: 'Aggregated indicators for the main panel' },
            { name: 'Members', description: 'Community members and their catalogs' },
            { name: 'Meetings', description: 'Meetings, their types and leaders' },
            {
                name: 'Territories',
                description: 'Territorial hierarchy: districts, zones and sectors',
            },
            { name: 'Users', description: 'Access accounts, invitations and status' },
            { name: 'Permissions', description: 'Permission management' },
            {
                name: 'Offerings',
                description: 'Meeting occurrences: pending dates, capture and history',
            },
            {
                name: 'Attendance',
                description: 'Attendance type catalog used to break down who attended',
            },
        ],
        paths: {
            '/api/healthcheck': {
                get: {
                    tags: ['Health'],
                    summary: 'Service health',
                    security: [],
                    responses: {
                        200: { description: 'Service is healthy' },
                    },
                },
            },
            '/api/permissions': {
                get: {
                    tags: ['Permissions'],
                    summary: 'List all permissions',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of permissions',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/Permission' },
                                            },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ['Permissions'],
                    summary: 'Create a permission',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreatePermissionDto' },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: 'Permission created',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: { $ref: '#/components/schemas/Permission' },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: 'Validation error' },
                        409: { description: 'Code or resource+action already exists' },
                    },
                },
            },
            '/api/permissions/{id}': {
                get: {
                    tags: ['Permissions'],
                    summary: 'Get permission by ID',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', format: 'int32', minimum: 1 },
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Permission found',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: { $ref: '#/components/schemas/Permission' },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        404: { description: 'Permission not found' },
                    },
                },
                put: {
                    tags: ['Permissions'],
                    summary: 'Update a permission',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', format: 'int32', minimum: 1 },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdatePermissionDto' },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Permission updated',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: { $ref: '#/components/schemas/Permission' },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: 'Validation error' },
                        404: { description: 'Permission not found' },
                        409: { description: 'Code or resource+action already exists' },
                    },
                },
                delete: {
                    tags: ['Permissions'],
                    summary: 'Delete a permission',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', format: 'int32', minimum: 1 },
                        },
                    ],
                    responses: {
                        200: { description: 'Permission deleted' },
                        404: { description: 'Permission not found' },
                    },
                },
            },
            '/api/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login with email and password',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LoginDto' },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Login successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: { $ref: '#/components/schemas/AuthResponse' },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        401: { description: 'Invalid credentials' },
                    },
                },
            },
            '/api/auth/refresh': {
                post: {
                    tags: ['Auth'],
                    summary: 'Refresh access token',
                    security: [],
                    requestBody: {
                        required: false,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/RefreshDto' },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Token refreshed successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: { $ref: '#/components/schemas/AuthResponse' },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        401: { description: 'Invalid refresh token' },
                    },
                },
            },
            '/api/auth/logout': {
                post: {
                    tags: ['Auth'],
                    summary: 'Logout and revoke refresh token',
                    security: [],
                    requestBody: {
                        required: false,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/RefreshDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Logged out' },
                    },
                },
            },
            '/api/offerings/pendientes': {
                get: {
                    tags: ['Offerings'],
                    summary: 'Pending dates within the caller scope',
                    description:
                        'Materializes any missing past occurrence before responding, so a supervisor returning after weeks sees the whole backlog.',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'Pending occurrences, oldest first' },
                        403: { description: 'Requires finance.view' },
                    },
                },
            },
            '/api/offerings/ocurrencias': {
                get: {
                    tags: ['Offerings'],
                    summary: 'List occurrences',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'status',
                            in: 'query',
                            schema: { type: 'string', enum: ['pendiente', 'registrada'] },
                        },
                        { name: 'meetingId', in: 'query', schema: { type: 'integer' } },
                        { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
                        { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
                    ],
                    responses: {
                        200: { description: 'Occurrences within the caller scope' },
                    },
                },
            },
            '/api/offerings/ocurrencias/{id}': {
                get: {
                    tags: ['Offerings'],
                    summary: 'Get one occurrence',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
                    ],
                    responses: {
                        200: { description: 'Occurrence detail' },
                        403: { description: 'Outside the caller scope' },
                        404: { description: 'Not found' },
                    },
                },
                put: {
                    tags: ['Offerings'],
                    summary: 'Correct an already recorded occurrence',
                    description:
                        'Requires finance.manage. This is what stops a leader from rewriting their own entry.',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/RecordOccurrenceDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Occurrence corrected' },
                        403: { description: 'Requires finance.manage' },
                        409: { description: 'The occurrence has not been recorded yet' },
                    },
                },
            },
            '/api/offerings/ocurrencias/{id}/registrar': {
                post: {
                    tags: ['Offerings'],
                    summary: 'Record a pending occurrence',
                    description: 'Requires finance.record. Recording is one-time only.',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/RecordOccurrenceDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Occurrence recorded' },
                        409: { description: 'Already recorded' },
                    },
                },
            },
            '/api/offerings/ocurrencias/registrar-lote': {
                post: {
                    tags: ['Offerings'],
                    summary: 'Record several occurrences at once',
                    description:
                        'Partial capture is the normal case: send only the dates you actually have.',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        entries: {
                                            type: 'array',
                                            items: {
                                                $ref: '#/components/schemas/BulkRecordEntryDto',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Occurrences recorded' },
                    },
                },
            },
            '/api/meetings/{id}/ocurrencias': {
                get: {
                    tags: ['Offerings'],
                    summary: 'Full history of one meeting',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
                    ],
                    responses: {
                        200: { description: 'Every date of the meeting, recorded or pending' },
                    },
                },
            },
            '/api/attendance-types': {
                get: {
                    tags: ['Attendance'],
                    summary: 'List attendance types',
                    description:
                        'Inactive types are returned too; the capture screen filters them.',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'Attendance type catalog' },
                        403: { description: 'Requires finance.view' },
                    },
                },
                post: {
                    tags: ['Attendance'],
                    summary: 'Create an attendance type',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateAttendanceTypeDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Attendance type created' },
                        403: { description: 'Requires finance.manage' },
                        409: { description: 'Code or name already in use' },
                    },
                },
            },
            '/api/attendance-types/{id}': {
                put: {
                    tags: ['Attendance'],
                    summary: 'Update an attendance type',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateAttendanceTypeDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Attendance type updated' },
                        403: { description: 'Requires finance.manage' },
                        404: { description: 'Attendance type not found' },
                    },
                },
                delete: {
                    tags: ['Attendance'],
                    summary: 'Delete an attendance type',
                    description:
                        'A type with recorded dates cannot be deleted; deactivate it instead.',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
                    ],
                    responses: {
                        200: { description: 'Attendance type deleted' },
                        403: { description: 'Requires finance.manage' },
                        404: { description: 'Attendance type not found' },
                        409: { description: 'The type already has recorded attendance' },
                    },
                },
            },
            '/api/meetings/ocurrencias/sincronizar': {
                post: {
                    tags: ['Offerings'],
                    summary: 'Force occurrence generation',
                    description:
                        'The pending query already syncs on read; this exists for bulk recurrence changes.',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'Occurrences synchronized' },
                        403: { description: 'Requires finance.manage' },
                    },
                },
            },
            '/api/docs': {
                get: {
                    tags: ['Health'],
                    summary: 'Scalar API reference (HTML)',
                    security: [],
                    responses: {
                        200: { description: 'Documentation UI', content: { 'text/html': {} } },
                    },
                },
            },
            '/api/openapi.json': {
                get: {
                    tags: ['Health'],
                    summary: 'This OpenAPI document',
                    security: [],
                    responses: { 200: { description: 'OpenAPI 3.0.3 specification' } },
                },
            },
            '/api/auth/me': {
                get: {
                    tags: ['Auth'],
                    summary: 'Current session',
                    description:
                        'Hydrates the client session. Reachable while a password change is pending.',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Session user, roles, permissions and token expiry',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: { $ref: '#/components/schemas/SessionUser' },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        401: { description: 'Missing or invalid token' },
                    },
                },
            },
            '/api/auth/change-password': {
                post: {
                    tags: ['Auth'],
                    summary: 'Change own password',
                    description:
                        'Rotates the session cookies on success. Reachable while a password change is pending.',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ChangePasswordDto' },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Password updated, new tokens issued',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: { $ref: '#/components/schemas/AuthResponse' },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: 'Validation error or password reuse' },
                        401: { description: 'Current password does not match' },
                    },
                },
            },
            '/api/auth/invitations/validate': {
                post: {
                    tags: ['Auth'],
                    summary: 'Validate an invitation token',
                    security: [],
                    description: 'Public endpoint used by the login screen before authenticating.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ValidateInvitationDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Invitation is valid' },
                        400: { description: 'Validation error' },
                        404: { description: 'Invitation not found, expired or already used' },
                    },
                },
            },
            '/api/dashboard/summary': {
                get: {
                    tags: ['Dashboard'],
                    summary: 'Main panel indicators',
                    description:
                        'Scoped by the caller: supervisors only aggregate their assigned sectors.',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'periodDays',
                            in: 'query',
                            schema: { type: 'integer', enum: [30, 90, 365], default: 30 },
                        },
                        {
                            name: 'districtId',
                            in: 'query',
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    responses: {
                        200: { description: 'Summary for the requested period' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires dashboard.view' },
                    },
                },
            },
            '/api/members': {
                get: {
                    tags: ['Members'],
                    summary: 'List members',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'All members with roles and ministries',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/Member' },
                                            },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        403: { description: 'Requires members.view' },
                    },
                },
                post: {
                    tags: ['Members'],
                    summary: 'Create a member',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateMemberDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Member created' },
                        400: { description: 'Validation error (includes DUI format)' },
                        403: { description: 'Requires members.create' },
                        409: { description: 'Code or document number already registered' },
                    },
                },
            },
            '/api/members/{id}': {
                put: {
                    tags: ['Members'],
                    summary: 'Update a member',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateMemberDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Member updated' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires members.update' },
                        404: { description: 'Member not found' },
                    },
                },
                delete: {
                    tags: ['Members'],
                    summary: 'Delete a member',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    responses: {
                        200: { description: 'Member deleted' },
                        403: { description: 'Requires members.update' },
                        404: { description: 'Member not found' },
                        409: { description: 'Member is referenced by meetings or territories' },
                    },
                },
            },
            '/api/members/catalogs': {
                get: {
                    tags: ['Members'],
                    summary: 'Catalogs for the member form',
                    description:
                        'Community roles, ministries, sectors and option lists used by the form and the import template.',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'Member catalogs' },
                        403: { description: 'Requires members.view' },
                    },
                },
            },
            '/api/members/import': {
                post: {
                    tags: ['Members'],
                    summary: 'Bulk import members',
                    description:
                        'Rows are validated one by one; valid rows are inserted and rejected ones are returned with their row number.',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ImportMembersDto' },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Import finished, possibly with rejected rows',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                $ref: '#/components/schemas/ImportMembersResult',
                                            },
                                            message: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires members.import_export' },
                    },
                },
            },
            '/api/meetings': {
                get: {
                    tags: ['Meetings'],
                    summary: 'List meetings',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'All meetings with type, sector and leader' },
                        403: { description: 'Requires meetings.view' },
                    },
                },
                post: {
                    tags: ['Meetings'],
                    summary: 'Create a meeting',
                    description:
                        'Recurring meetings generate their occurrences from `frequency` and `recurrenceEndDate`.',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateMeetingDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Meeting created' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires meetings.manage' },
                        404: { description: 'Type, sector, leader or supervisor not found' },
                    },
                },
            },
            '/api/meetings/{id}': {
                get: {
                    tags: ['Meetings'],
                    summary: 'Get a meeting',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    responses: {
                        200: { description: 'Meeting found' },
                        403: { description: 'Requires meetings.view' },
                        404: { description: 'Meeting not found' },
                    },
                },
                put: {
                    tags: ['Meetings'],
                    summary: 'Update a meeting',
                    description:
                        'Changing the recurrence resynchronizes the pending occurrences of the meeting.',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateMeetingDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Meeting updated' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires meetings.manage' },
                        404: { description: 'Meeting not found' },
                    },
                },
                delete: {
                    tags: ['Meetings'],
                    summary: 'Delete a meeting',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    responses: {
                        200: { description: 'Meeting deleted' },
                        403: { description: 'Requires meetings.manage' },
                        404: { description: 'Meeting not found' },
                        409: { description: 'Meeting has recorded occurrences' },
                    },
                },
            },
            '/api/meetings/leaders': {
                get: {
                    tags: ['Meetings'],
                    summary: 'Members eligible to lead a meeting',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'Leader options' },
                        403: { description: 'Requires meetings.view' },
                    },
                },
            },
            '/api/meeting-types': {
                get: {
                    tags: ['Meetings'],
                    summary: 'Meeting type catalog',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'Active meeting types' },
                        403: { description: 'Requires meetings.view' },
                    },
                },
            },
            '/api/offering-categories': {
                get: {
                    tags: ['Offerings'],
                    summary: 'Offering category catalog',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'Active offering categories' },
                        403: { description: 'Requires finance.view' },
                    },
                },
            },
            '/api/territories': {
                get: {
                    tags: ['Territories'],
                    summary: 'Full territorial hierarchy',
                    description: 'Districts with their zones, and zones with their sectors.',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'Hierarchy with polygons' },
                        403: { description: 'Requires territories.view' },
                    },
                },
            },
            '/api/territories/supervisors': {
                get: {
                    tags: ['Territories'],
                    summary: 'Members assignable as sector supervisors',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'Supervisor options' },
                        403: { description: 'Requires territories.view' },
                    },
                },
            },
            '/api/territories/districts': {
                post: {
                    tags: ['Territories'],
                    summary: 'Create a district',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateDistrictDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'District created' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires territories.manage' },
                    },
                },
            },
            '/api/territories/districts/{id}': {
                put: {
                    tags: ['Territories'],
                    summary: 'Update a district',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateDistrictDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'District updated' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires territories.manage' },
                        404: { description: 'District not found' },
                    },
                },
                delete: {
                    tags: ['Territories'],
                    summary: 'Delete a district',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    responses: {
                        200: { description: 'District deleted' },
                        403: { description: 'Requires territories.manage' },
                        404: { description: 'District not found' },
                        409: { description: 'District still has zones' },
                    },
                },
            },
            '/api/territories/zones': {
                post: {
                    tags: ['Territories'],
                    summary: 'Create a zone',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateZoneDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Zone created' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires territories.manage' },
                        404: { description: 'District not found' },
                    },
                },
            },
            '/api/territories/zones/{id}': {
                put: {
                    tags: ['Territories'],
                    summary: 'Update a zone',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateZoneDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Zone updated' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires territories.manage' },
                        404: { description: 'Zone not found' },
                    },
                },
                delete: {
                    tags: ['Territories'],
                    summary: 'Delete a zone',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    responses: {
                        200: { description: 'Zone deleted' },
                        403: { description: 'Requires territories.manage' },
                        404: { description: 'Zone not found' },
                        409: { description: 'Zone still has sectors' },
                    },
                },
            },
            '/api/territories/sectors': {
                post: {
                    tags: ['Territories'],
                    summary: 'Create a sector',
                    description:
                        'The supervisor assigned here defines the row-level visibility of that user over meetings and offerings.',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateSectorDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Sector created' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires territories.manage' },
                        404: { description: 'Zone or supervisor not found' },
                    },
                },
            },
            '/api/territories/sectors/{id}': {
                put: {
                    tags: ['Territories'],
                    summary: 'Update a sector',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateSectorDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Sector updated' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires territories.manage' },
                        404: { description: 'Sector not found' },
                    },
                },
                delete: {
                    tags: ['Territories'],
                    summary: 'Delete a sector',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    responses: {
                        200: { description: 'Sector deleted' },
                        403: { description: 'Requires territories.manage' },
                        404: { description: 'Sector not found' },
                        409: { description: 'Sector still has meetings' },
                    },
                },
            },
            '/api/users': {
                get: {
                    tags: ['Users'],
                    summary: 'List access accounts',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'Users with their roles and status' },
                        403: { description: 'Requires users.view' },
                    },
                },
                post: {
                    tags: ['Users'],
                    summary: 'Create a user and send the invitation',
                    description:
                        'Generates a temporary password and emails the invitation link. The account is linked to an existing member.',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateUserDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'User created and invitation sent' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires users.create' },
                        404: { description: 'Member or role not found' },
                        409: { description: 'Email, username or member already has an account' },
                    },
                },
            },
            '/api/users/{id}': {
                put: {
                    tags: ['Users'],
                    summary: 'Update a user',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateUserDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'User updated' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires users.update' },
                        404: { description: 'User not found' },
                        409: { description: 'Email or username already in use' },
                    },
                },
            },
            '/api/users/{id}/reset-password': {
                post: {
                    tags: ['Users'],
                    summary: 'Reset the password and resend the invitation',
                    description:
                        'Issues a new temporary password and emails a fresh invitation link.',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ResetUserPasswordDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Temporary password and invitation resent' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires users.update' },
                        404: { description: 'User not found' },
                    },
                },
            },
            '/api/users/{id}/status': {
                patch: {
                    tags: ['Users'],
                    summary: 'Block or unblock a user',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer', minimum: 1 },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateUserStatusDto' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Status updated' },
                        400: { description: 'Validation error' },
                        403: { description: 'Requires users.block' },
                        404: { description: 'User not found' },
                    },
                },
            },
            '/api/users/catalog': {
                get: {
                    tags: ['Users'],
                    summary: 'Catalogs for the user form',
                    description: 'Assignable roles and members without an account yet.',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'User catalogs' },
                        403: { description: 'Requires users.view' },
                    },
                },
            },
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                RecordOccurrenceDto: {
                    type: 'object',
                    required: ['attendance'],
                    properties: {
                        attendance: { type: 'integer', minimum: 0 },
                        totalAmount: {
                            type: 'number',
                            nullable: true,
                            description: 'Only used when there is no per-category breakdown.',
                        },
                        currency: { type: 'string', default: 'USD' },
                        notes: { type: 'string', nullable: true },
                        attendanceDetails: {
                            type: 'array',
                            description:
                                'Attendance broken down by type. When present, `attendance` is recalculated from it.',
                            items: {
                                type: 'object',
                                required: ['typeId', 'quantity'],
                                properties: {
                                    typeId: { type: 'integer' },
                                    quantity: { type: 'integer', minimum: 0 },
                                },
                            },
                        },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['categoryId', 'amount'],
                                properties: {
                                    categoryId: { type: 'integer' },
                                    amount: { type: 'number', minimum: 0 },
                                    notes: { type: 'string', nullable: true },
                                },
                            },
                        },
                    },
                },
                BulkRecordEntryDto: {
                    allOf: [
                        { $ref: '#/components/schemas/RecordOccurrenceDto' },
                        {
                            type: 'object',
                            required: ['occurrenceId'],
                            properties: { occurrenceId: { type: 'integer' } },
                        },
                    ],
                },
                CreateAttendanceTypeDto: {
                    type: 'object',
                    required: ['code', 'name'],
                    properties: {
                        code: { type: 'string', example: 'HERMANOS' },
                        name: { type: 'string', example: 'Hermanos' },
                        description: { type: 'string', nullable: true },
                        sortOrder: { type: 'integer', minimum: 0, default: 0 },
                        isActive: { type: 'boolean', default: true },
                    },
                },
                UpdateAttendanceTypeDto: {
                    type: 'object',
                    properties: {
                        code: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        sortOrder: { type: 'integer', minimum: 0 },
                        isActive: { type: 'boolean' },
                    },
                },
                Permission: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', format: 'int32' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                        resource: { type: 'string' },
                        action: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                CreatePermissionDto: {
                    type: 'object',
                    required: ['name', 'code', 'resource', 'action'],
                    properties: {
                        name: { type: 'string' },
                        code: { type: 'string', example: 'users:read' },
                        resource: { type: 'string', example: 'users' },
                        action: { type: 'string', example: 'read' },
                        description: { type: 'string' },
                    },
                },
                UpdatePermissionDto: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        code: { type: 'string' },
                        resource: { type: 'string' },
                        action: { type: 'string' },
                        description: { type: 'string' },
                    },
                },
                LoginDto: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 8,
                            maxLength: 128,
                        },
                        invitationToken: {
                            type: 'string',
                            minLength: 32,
                            maxLength: 200,
                            description: 'Consumes the invitation when logging in from its link.',
                        },
                    },
                },
                ChangePasswordDto: {
                    type: 'object',
                    required: ['currentPassword', 'newPassword'],
                    properties: {
                        currentPassword: { type: 'string', format: 'password' },
                        newPassword: {
                            type: 'string',
                            format: 'password',
                            minLength: 10,
                            maxLength: 128,
                            description:
                                'Must contain lowercase, uppercase, digit and symbol, and differ from the current one.',
                        },
                    },
                },
                ValidateInvitationDto: {
                    type: 'object',
                    required: ['invitationToken'],
                    properties: {
                        invitationToken: { type: 'string', minLength: 32, maxLength: 200 },
                    },
                },
                RefreshDto: {
                    type: 'object',
                    properties: {
                        refreshToken: { type: 'string' },
                    },
                },
                AuthPermission: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', format: 'int32' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                        resource: { type: 'string' },
                        action: { type: 'string' },
                        description: { type: 'string', nullable: true },
                    },
                },
                AuthRole: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', format: 'int32' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        permissions: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/AuthPermission' },
                        },
                    },
                },
                AuthUser: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', format: 'int32' },
                        email: { type: 'string', format: 'email' },
                        username: { type: 'string', nullable: true },
                        roles: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/AuthRole' },
                        },
                        permissions: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/AuthPermission' },
                        },
                    },
                },
                AuthTokens: {
                    type: 'object',
                    properties: {
                        tokenType: { type: 'string', example: 'Bearer' },
                        accessToken: { type: 'string' },
                        accessTokenExpiresIn: { type: 'number', example: 900 },
                        refreshTokenExpiresIn: { type: 'number', example: 604800 },
                    },
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        user: { $ref: '#/components/schemas/AuthUser' },
                        tokens: { $ref: '#/components/schemas/AuthTokens' },
                    },
                },
                SessionUser: {
                    allOf: [
                        { $ref: '#/components/schemas/AuthUser' },
                        {
                            type: 'object',
                            properties: {
                                mustChangePassword: { type: 'boolean' },
                                tokenExpiresAt: {
                                    type: 'integer',
                                    description:
                                        'Access token expiry as a Unix timestamp in milliseconds. Drives the session expiry warning.',
                                },
                            },
                        },
                    ],
                },
                Member: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        code: { type: 'string' },
                        firstName: { type: 'string' },
                        middleName: { type: 'string', nullable: true },
                        lastName: { type: 'string' },
                        secondLastName: { type: 'string', nullable: true },
                        preferredName: { type: 'string', nullable: true },
                        documentNumber: { type: 'string', example: '01234567-8' },
                        birthDate: { type: 'string', format: 'date', nullable: true },
                        gender: { $ref: '#/components/schemas/MemberGender' },
                        maritalStatus: { $ref: '#/components/schemas/MemberMaritalStatus' },
                        phone: { type: 'string', nullable: true },
                        email: { type: 'string', format: 'email', nullable: true },
                        status: { $ref: '#/components/schemas/MemberStatus' },
                        roles: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/MemberRoleCode' },
                        },
                        ministries: { type: 'array', items: { type: 'string' } },
                        sector: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                MemberGender: { type: 'string', enum: ['FEMALE', 'MALE'] },
                MemberMaritalStatus: {
                    type: 'string',
                    enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'UNION', 'UNSPECIFIED'],
                    default: 'UNSPECIFIED',
                },
                MemberStatus: {
                    type: 'string',
                    enum: ['ACTIVE', 'INACTIVE', 'VISITOR', 'TRANSFERRED', 'DECEASED'],
                    default: 'ACTIVE',
                },
                MemberRoleCode: {
                    type: 'string',
                    enum: [
                        'MEMBER',
                        'PASTOR',
                        'LEADER',
                        'HOST',
                        'SUPERVISOR',
                        'DEACON',
                        'VOLUNTEER',
                        'TEACHER',
                        'WORSHIP',
                        'YOUTH_LEADER',
                        'CHILDREN_LEADER',
                    ],
                },
                CreateMemberDto: {
                    type: 'object',
                    required: ['firstName', 'lastName', 'documentNumber', 'gender', 'sector'],
                    properties: {
                        code: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 30,
                            pattern: '^[A-Z0-9]+(?:-[A-Z0-9]+)*$',
                            description: 'Generated automatically when omitted.',
                        },
                        firstName: { type: 'string', minLength: 2, maxLength: 100 },
                        middleName: { type: 'string', maxLength: 100, nullable: true },
                        lastName: { type: 'string', minLength: 2, maxLength: 100 },
                        secondLastName: { type: 'string', maxLength: 100, nullable: true },
                        preferredName: { type: 'string', maxLength: 100, nullable: true },
                        documentNumber: {
                            type: 'string',
                            example: '01234567-8',
                            description: 'Salvadoran DUI; validated and normalized server-side.',
                        },
                        birthDate: { type: 'string', format: 'date', nullable: true },
                        gender: { $ref: '#/components/schemas/MemberGender' },
                        maritalStatus: { $ref: '#/components/schemas/MemberMaritalStatus' },
                        phone: { type: 'string', maxLength: 100, nullable: true },
                        alternatePhone: { type: 'string', maxLength: 100, nullable: true },
                        email: { type: 'string', format: 'email', maxLength: 100, nullable: true },
                        address: { type: 'string', maxLength: 300, nullable: true },
                        country: { type: 'string', maxLength: 100, nullable: true },
                        municipality: { type: 'string', maxLength: 100, nullable: true },
                        department: { type: 'string', maxLength: 100, nullable: true },
                        occupation: { type: 'string', maxLength: 100, nullable: true },
                        status: { $ref: '#/components/schemas/MemberStatus' },
                        roles: {
                            type: 'array',
                            minItems: 1,
                            uniqueItems: true,
                            default: ['MEMBER'],
                            items: { $ref: '#/components/schemas/MemberRoleCode' },
                        },
                        ministries: {
                            type: 'array',
                            maxItems: 20,
                            uniqueItems: true,
                            items: { type: 'string', maxLength: 100 },
                        },
                        joinedAt: { type: 'string', format: 'date', nullable: true },
                        conversionDate: { type: 'string', format: 'date', nullable: true },
                        baptismDate: { type: 'string', format: 'date', nullable: true },
                        sector: {
                            type: 'string',
                            maxLength: 100,
                            description: 'Sector name; must match an existing sector.',
                        },
                        smallGroup: { type: 'string', maxLength: 100, nullable: true },
                        emergencyContactName: { type: 'string', maxLength: 100, nullable: true },
                        emergencyContactPhone: { type: 'string', maxLength: 100, nullable: true },
                        notes: { type: 'string', maxLength: 600, nullable: true },
                    },
                },
                UpdateMemberDto: {
                    allOf: [
                        { $ref: '#/components/schemas/CreateMemberDto' },
                        {
                            type: 'object',
                            description: 'Every field is optional, but at least one is required.',
                            minProperties: 1,
                        },
                    ],
                },
                ImportMembersDto: {
                    type: 'object',
                    required: ['rows'],
                    properties: {
                        rows: {
                            type: 'array',
                            minItems: 1,
                            maxItems: 1000,
                            items: {
                                type: 'object',
                                required: ['rowNumber', 'member'],
                                properties: {
                                    rowNumber: {
                                        type: 'integer',
                                        minimum: 2,
                                        description:
                                            'Spreadsheet row, used to report rejections back to the user.',
                                    },
                                    member: {
                                        type: 'object',
                                        description:
                                            'Raw row; validated per row with the member rules.',
                                    },
                                },
                            },
                        },
                    },
                },
                ImportMembersResult: {
                    type: 'object',
                    properties: {
                        imported: { type: 'integer' },
                        rejected: { type: 'integer' },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    rowNumber: { type: 'integer' },
                                    messages: { type: 'array', items: { type: 'string' } },
                                },
                            },
                        },
                    },
                },
                MeetingFrequency: {
                    type: 'string',
                    enum: ['unica', 'diaria', 'semanal', 'quincenal', 'mensual'],
                    default: 'unica',
                },
                CreateMeetingDto: {
                    type: 'object',
                    required: [
                        'typeId',
                        'sectorId',
                        'leaderId',
                        'supervisorId',
                        'title',
                        'date',
                        'startTime',
                        'endTime',
                        'location',
                        'color',
                    ],
                    properties: {
                        typeId: { type: 'integer', minimum: 1 },
                        sectorId: { type: 'integer', minimum: 1 },
                        leaderId: { type: 'integer', minimum: 1 },
                        supervisorId: { type: 'integer', minimum: 1 },
                        coSupervisorIds: {
                            type: 'array',
                            items: { type: 'integer', minimum: 1 },
                            default: [],
                        },
                        title: { type: 'string', minLength: 2, maxLength: 100 },
                        description: { type: 'string', maxLength: 300, nullable: true },
                        date: { type: 'string', format: 'date', description: 'ISO 8601 date.' },
                        recurrenceEndDate: {
                            type: 'string',
                            format: 'date',
                            nullable: true,
                            description: 'Upper bound for generated occurrences.',
                        },
                        startTime: {
                            type: 'string',
                            pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
                            example: '19:00',
                        },
                        endTime: {
                            type: 'string',
                            pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
                            example: '21:00',
                        },
                        location: { type: 'string', minLength: 2, maxLength: 300 },
                        latitude: { type: 'number', minimum: -90, maximum: 90, nullable: true },
                        longitude: { type: 'number', minimum: -180, maximum: 180, nullable: true },
                        frequency: { $ref: '#/components/schemas/MeetingFrequency' },
                        monthlyMode: {
                            type: 'string',
                            enum: ['dia_fijo', 'ordinal'],
                            nullable: true,
                            description: 'Only used when frequency is `mensual`.',
                        },
                        weekOrdinal: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 5,
                            nullable: true,
                            description: 'Week of the month when monthlyMode is `ordinal`.',
                        },
                        weekday: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 6,
                            nullable: true,
                            description: '0 = Sunday.',
                        },
                        expectedAttendees: { type: 'integer', minimum: 0, default: 0 },
                        isActive: { type: 'boolean', default: true },
                        isPublic: { type: 'boolean', default: false },
                        notes: { type: 'string', maxLength: 600, nullable: true },
                        color: { type: 'string', pattern: '^#[0-9a-f]{6}$', example: '#e9c176' },
                    },
                },
                UpdateMeetingDto: {
                    allOf: [
                        { $ref: '#/components/schemas/CreateMeetingDto' },
                        {
                            type: 'object',
                            description: 'Every field is optional, but at least one is required.',
                            minProperties: 1,
                        },
                    ],
                },
                Polygon: {
                    type: 'array',
                    minItems: 3,
                    maxItems: 500,
                    description: 'Closed area as [latitude, longitude] pairs.',
                    items: {
                        type: 'array',
                        minItems: 2,
                        maxItems: 2,
                        items: { type: 'number' },
                        example: [13.6929, -89.2182],
                    },
                },
                CreateDistrictDto: {
                    type: 'object',
                    required: ['name', 'color', 'polygon'],
                    properties: {
                        name: { type: 'string', minLength: 2, maxLength: 100 },
                        leaderName: { type: 'string', maxLength: 100, nullable: true },
                        description: { type: 'string', maxLength: 300, nullable: true },
                        color: { type: 'string', pattern: '^#[0-9a-f]{6}$', example: '#e9c176' },
                        polygon: { $ref: '#/components/schemas/Polygon' },
                        isActive: { type: 'boolean', default: true },
                    },
                },
                UpdateDistrictDto: {
                    allOf: [
                        { $ref: '#/components/schemas/CreateDistrictDto' },
                        {
                            type: 'object',
                            description: 'Every field is optional, but at least one is required.',
                            minProperties: 1,
                        },
                    ],
                },
                CreateZoneDto: {
                    allOf: [
                        { $ref: '#/components/schemas/CreateDistrictDto' },
                        {
                            type: 'object',
                            required: ['districtId'],
                            properties: { districtId: { type: 'integer', minimum: 1 } },
                        },
                    ],
                },
                UpdateZoneDto: {
                    allOf: [
                        { $ref: '#/components/schemas/CreateZoneDto' },
                        {
                            type: 'object',
                            description: 'Every field is optional, but at least one is required.',
                            minProperties: 1,
                        },
                    ],
                },
                CreateSectorDto: {
                    type: 'object',
                    required: ['name', 'color', 'polygon', 'zoneId', 'supervisorId'],
                    properties: {
                        name: { type: 'string', minLength: 2, maxLength: 100 },
                        description: { type: 'string', maxLength: 300, nullable: true },
                        color: { type: 'string', pattern: '^#[0-9a-f]{6}$', example: '#e9c176' },
                        polygon: { $ref: '#/components/schemas/Polygon' },
                        isActive: { type: 'boolean', default: true },
                        zoneId: { type: 'integer', minimum: 1 },
                        supervisorId: {
                            type: 'integer',
                            minimum: 1,
                            description:
                                'Member responsible for the sector; defines what that user can see.',
                        },
                    },
                },
                UpdateSectorDto: {
                    allOf: [
                        { $ref: '#/components/schemas/CreateSectorDto' },
                        {
                            type: 'object',
                            description: 'Every field is optional, but at least one is required.',
                            minProperties: 1,
                        },
                    ],
                },
                UserStatus: { type: 'string', enum: ['ACTIVE', 'INVITED', 'BLOCKED'] },
                CreateUserDto: {
                    type: 'object',
                    required: [
                        'memberId',
                        'username',
                        'email',
                        'roleCodes',
                        'requirePasswordChange',
                        'invitationExpiresInHours',
                    ],
                    properties: {
                        memberId: {
                            type: 'integer',
                            minimum: 1,
                            description: 'Existing member the account belongs to.',
                        },
                        username: {
                            type: 'string',
                            minLength: 4,
                            maxLength: 100,
                            pattern: '^[a-z0-9._-]+$',
                        },
                        email: { type: 'string', format: 'email', maxLength: 100 },
                        roleCodes: {
                            type: 'array',
                            minItems: 1,
                            maxItems: 8,
                            uniqueItems: true,
                            items: { type: 'string', example: 'SECRETARY' },
                        },
                        requirePasswordChange: {
                            type: 'boolean',
                            description: 'Forces /cambiar-clave on first login.',
                        },
                        twoFactorEnabled: { type: 'boolean', default: false },
                        invitationExpiresInHours: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 168,
                        },
                    },
                },
                UpdateUserDto: {
                    type: 'object',
                    required: [
                        'username',
                        'email',
                        'roleCodes',
                        'status',
                        'requirePasswordChange',
                        'twoFactorEnabled',
                    ],
                    properties: {
                        username: {
                            type: 'string',
                            minLength: 4,
                            maxLength: 100,
                            pattern: '^[a-z0-9._-]+$',
                        },
                        email: { type: 'string', format: 'email', maxLength: 100 },
                        roleCodes: {
                            type: 'array',
                            minItems: 1,
                            maxItems: 8,
                            uniqueItems: true,
                            items: { type: 'string' },
                        },
                        status: { $ref: '#/components/schemas/UserStatus' },
                        requirePasswordChange: { type: 'boolean' },
                        twoFactorEnabled: { type: 'boolean' },
                    },
                },
                UpdateUserStatusDto: {
                    type: 'object',
                    required: ['status'],
                    properties: {
                        status: { type: 'string', enum: ['ACTIVE', 'BLOCKED'] },
                    },
                },
                ResetUserPasswordDto: {
                    type: 'object',
                    required: ['requirePasswordChange', 'invitationExpiresInHours'],
                    properties: {
                        requirePasswordChange: { type: 'boolean' },
                        invitationExpiresInHours: { type: 'integer', minimum: 1, maximum: 168 },
                    },
                },
            },
        },
    }
}

export function createScalarHtml() {
    return `<!doctype html>
<html>
  <head>
    <title>API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>body { margin: 0 }</style>
  </head>
  <body>
    <script id="api-reference" data-url="/api/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.js"></script>
  </body>
</html>`
}
