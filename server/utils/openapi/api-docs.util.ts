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
            { name: 'Health', description: 'Health check' },
            { name: 'Auth', description: 'Authentication and token lifecycle' },
            { name: 'Permissions', description: 'Permission management' },
            {
                name: 'Offerings',
                description: 'Meeting occurrences: pending dates, capture and history',
            },
        ],
        paths: {
            '/api/healthcheck': {
                get: {
                    tags: ['Health'],
                    summary: 'Service health',
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
                        password: { type: 'string', format: 'password' },
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
