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
                            schema: { type: 'string', format: 'uuid' },
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
                            schema: { type: 'string', format: 'uuid' },
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
                            schema: { type: 'string', format: 'uuid' },
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
                Permission: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
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
                        id: { type: 'string', format: 'uuid' },
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
                        id: { type: 'string', format: 'uuid' },
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
                        id: { type: 'string', format: 'uuid' },
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
